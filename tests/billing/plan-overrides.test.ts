import assert from "node:assert/strict";
import test from "node:test";

import {
  getFeedbackEntitlement,
  getMenuExtractionEntitlement,
  getScanEntitlement,
  hasProAccess,
  PRO_MENU_EXTRACTION_LIMIT,
  FREE_MENU_EXTRACTION_LIMIT,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import {
  pickActiveOverride,
  resolveEffectiveLimits,
  type PlanOverrideRow,
} from "@/lib/billing/overrides";
import { getAiScanLimit, getFeedbackLimit } from "@/lib/billing/plans";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const now = new Date("2026-04-25T12:00:00.000Z");

function restaurant(
  tier: "free" | "starter" | "pro",
  overrides: Partial<RestaurantEntitlementState> = {},
): RestaurantEntitlementState {
  return {
    id: `restaurant-${tier}`,
    tier,
    subscription_status: tier !== "free" ? "active" : "none",
    current_period_ends_at: tier !== "free" ? "2026-05-25T12:00:00.000Z" : null,
    trial_ends_at: null,
    ...overrides,
  };
}

function usage(feedbackCount = 0, aiScanCount = 0, menuExtractionCount = 0) {
  return { feedbackCount, aiScanCount, menuExtractionCount };
}

const emptyCredits = { granted: 0, used: 0, remaining: 0 };

function makeOverride(
  partial: Partial<PlanOverrideRow> & { restaurant_id?: string },
): PlanOverrideRow {
  return {
    id: "override-1",
    restaurant_id: "restaurant-free",
    override_tier: null,
    override_feedback_limit: null,
    override_scan_limit: null,
    reason: "test override",
    granted_by: "admin-uuid",
    starts_at: "2026-04-01T00:00:00.000Z",
    expires_at: null,
    created_at: "2026-04-01T00:00:00.000Z",
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Case (a): No override row → returns the restaurant's stored tier and plans.ts limits.
// ---------------------------------------------------------------------------

test("(a) no override → stored tier and default plan limits are used", () => {
  const r = restaurant("free");
  const activeOverride = pickActiveOverride([], now);
  assert.equal(activeOverride, null);

  const resolved = resolveEffectiveLimits(r.tier, null);
  assert.equal(resolved.effectiveTier, "free");
  assert.equal(resolved.effectiveFeedbackLimit, getFeedbackLimit("free"));
  assert.equal(resolved.effectiveScanLimit, getAiScanLimit("free"));
  assert.equal(resolved.hasOverride, false);

  // The entitlement functions must behave identically when no overrideLimits are passed.
  const feedbackResult = getFeedbackEntitlement({
    restaurant: r,
    usage: usage(0),
    now,
  });
  assert.equal(feedbackResult.limit, getFeedbackLimit("free"));

  const scanResult = getScanEntitlement({
    restaurant: r,
    usage: usage(0, 0),
    creditSummary: emptyCredits,
    now,
  });
  assert.equal(scanResult.limit, getAiScanLimit("free"));
});

// ---------------------------------------------------------------------------
// Case (b): Active override with override_tier='pro' and null limits → Pro limits.
// ---------------------------------------------------------------------------

test("(b) active override with override_tier='pro' and null limits → Pro limits", () => {
  const r = restaurant("free");
  const override = makeOverride({ override_tier: "pro" });

  const activeOverride = pickActiveOverride([override], now);
  assert.ok(activeOverride !== null);

  const resolved = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(resolved.effectiveTier, "pro");
  assert.equal(resolved.effectiveFeedbackLimit, getFeedbackLimit("pro"));
  assert.equal(resolved.effectiveScanLimit, getAiScanLimit("pro"));
  assert.equal(resolved.hasOverride, true);

  // Entitlement functions must use the Pro limits when overrideLimits supplied.
  const feedbackResult = getFeedbackEntitlement({
    restaurant: r,
    usage: usage(getFeedbackLimit("pro") - 1),
    overrideLimits: resolved,
    now,
  });
  assert.equal(feedbackResult.allowed, true);
  assert.equal(feedbackResult.limit, getFeedbackLimit("pro"));

  const scanResult = getScanEntitlement({
    restaurant: r,
    usage: usage(0, getAiScanLimit("pro") - 1),
    creditSummary: emptyCredits,
    overrideLimits: resolved,
    now,
  });
  assert.equal(scanResult.allowed, true);
  assert.equal(scanResult.limit, getAiScanLimit("pro"));
});

// ---------------------------------------------------------------------------
// Case (c): override_scan_limit=999, null override_tier → stored tier, scan limit=999.
// ---------------------------------------------------------------------------

test("(c) override_scan_limit=999 with null override_tier → stored tier, scan limit overridden", () => {
  const r = restaurant("free");
  const override = makeOverride({ override_scan_limit: 999 });

  const activeOverride = pickActiveOverride([override], now);
  assert.ok(activeOverride !== null);

  const resolved = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(resolved.effectiveTier, "free"); // tier unchanged
  assert.equal(resolved.effectiveScanLimit, 999); // limit overridden
  assert.equal(resolved.effectiveFeedbackLimit, getFeedbackLimit("free")); // unchanged
  assert.equal(resolved.hasOverride, true);

  const scanResult = getScanEntitlement({
    restaurant: r,
    usage: usage(0, 998),
    creditSummary: emptyCredits,
    overrideLimits: resolved,
    now,
  });
  assert.equal(scanResult.allowed, true);
  assert.equal(scanResult.limit, 999);
  assert.equal(scanResult.remaining, 1);
});

// ---------------------------------------------------------------------------
// Case (d): Override with expires_at in the past → ignored; falls back to restaurant tier.
// ---------------------------------------------------------------------------

test("(d) expired override is ignored and restaurant tier is used", () => {
  const r = restaurant("free");
  const expiredOverride = makeOverride({
    override_tier: "pro",
    expires_at: "2026-04-20T00:00:00.000Z", // before `now` (2026-04-25)
  });

  const activeOverride = pickActiveOverride([expiredOverride], now);
  assert.equal(activeOverride, null); // must be filtered out

  const resolved = resolveEffectiveLimits(r.tier, null);
  assert.equal(resolved.effectiveTier, "free");
  assert.equal(resolved.effectiveScanLimit, getAiScanLimit("free"));
  assert.equal(resolved.hasOverride, false);
});

// ---------------------------------------------------------------------------
// Case (e): Multiple overrides — most recently created active one wins.
// ---------------------------------------------------------------------------

test("(e) most recently created active override wins when multiple exist", () => {
  const r = restaurant("starter");

  const older = makeOverride({
    id: "override-older",
    override_scan_limit: 300,
    created_at: "2026-04-10T00:00:00.000Z",
  });

  const newer = makeOverride({
    id: "override-newer",
    override_scan_limit: 999,
    created_at: "2026-04-20T00:00:00.000Z",
  });

  const activeOverride = pickActiveOverride([older, newer], now);
  assert.ok(activeOverride !== null);
  assert.equal(activeOverride.id, "override-newer");
  assert.equal(activeOverride.override_scan_limit, 999);

  const resolved = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(resolved.effectiveScanLimit, 999);

  // Older override is not used.
  const olderResolved = resolveEffectiveLimits(r.tier, older);
  assert.equal(olderResolved.effectiveScanLimit, 300);
});

// ---------------------------------------------------------------------------
// Extra: starts_at in the future → not yet active.
// ---------------------------------------------------------------------------

test("override with starts_at in the future is not yet active", () => {
  const futureOverride = makeOverride({
    override_tier: "pro",
    starts_at: "2026-05-01T00:00:00.000Z", // after `now` (2026-04-25)
  });

  const activeOverride = pickActiveOverride([futureOverride], now);
  assert.equal(activeOverride, null);
});

// ---------------------------------------------------------------------------
// Bug B: canExtractMenu with override_tier='pro' returns Pro menu limit.
// ---------------------------------------------------------------------------

test("(f) override_tier='pro' on a Free restaurant grants Pro menu extraction limit", () => {
  const r = restaurant("free");
  const override = makeOverride({ override_tier: "pro" });

  const activeOverride = pickActiveOverride([override], now);
  assert.ok(activeOverride !== null);

  const resolved = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(resolved.effectiveTier, "pro");

  const entitlement = getMenuExtractionEntitlement({
    restaurant: r,
    usage: usage(0, 0, PRO_MENU_EXTRACTION_LIMIT - 1),
    overrideLimits: resolved,
    now,
  });

  assert.equal(entitlement.allowed, true);
  assert.equal(entitlement.limit, PRO_MENU_EXTRACTION_LIMIT);

  // Without override, free limit is 1.
  const withoutOverride = getMenuExtractionEntitlement({
    restaurant: r,
    usage: usage(0, 0, FREE_MENU_EXTRACTION_LIMIT),
    now,
  });
  assert.equal(withoutOverride.allowed, false);
  assert.equal(withoutOverride.limit, FREE_MENU_EXTRACTION_LIMIT);
});

test("(g) no override on a Free restaurant → FREE_MENU_EXTRACTION_LIMIT applies", () => {
  const r = restaurant("free");

  const allowed = getMenuExtractionEntitlement({
    restaurant: r,
    usage: usage(0, 0, 0),
    now,
  });
  const blocked = getMenuExtractionEntitlement({
    restaurant: r,
    usage: usage(0, 0, FREE_MENU_EXTRACTION_LIMIT),
    now,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.limit, FREE_MENU_EXTRACTION_LIMIT);
  assert.equal(blocked.allowed, false);
});

// ---------------------------------------------------------------------------
// Bug C: hasProAccess — subscription_status and override checks.
//
// Interpretation:
//   - tier=pro + subscription_status='active' → Pro access (true)
//   - tier=pro + subscription_status='canceled' → No Pro access (false)
//   - tier=pro + subscription_status='past_due' → No Pro access (false,
//     because past_due without a future current_period_ends_at means lapsed)
//   - tier=free + active trial → Pro access (true)
//   - tier=free + override_tier='pro' → Pro access (true) — the override
//     carries the effective tier; subscription_status='none' for a free
//     restaurant is fine because the override is an explicit admin grant,
//     not a subscription state.  We treat override_tier='pro' as implicitly
//     active for the duration of the override.
// ---------------------------------------------------------------------------

test("hasProAccess: tier=pro + subscription_status='active' → true", () => {
  assert.equal(
    hasProAccess({
      tier: "pro",
      subscription_status: "active",
      trial_ends_at: null,
    }),
    true,
  );
});

test("hasProAccess: tier=pro + subscription_status='canceled' → false", () => {
  assert.equal(
    hasProAccess({
      tier: "pro",
      subscription_status: "canceled",
      trial_ends_at: null,
    }),
    false,
  );
});

test("hasProAccess: tier=pro + subscription_status='past_due' → false", () => {
  assert.equal(
    hasProAccess({
      tier: "pro",
      subscription_status: "past_due",
      trial_ends_at: null,
    }),
    false,
  );
});

test("hasProAccess: tier=free + active trial → true (trial takes precedence)", () => {
  // Use a date far in the future so this test does not expire.
  const futureDate = new Date(
    Date.now() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  assert.equal(
    hasProAccess({
      tier: "free",
      subscription_status: "trialing",
      trial_ends_at: futureDate,
    }),
    true,
  );
});

test("hasProAccess: tier=free + expired trial → false", () => {
  assert.equal(
    hasProAccess({
      tier: "free",
      subscription_status: "trialing",
      trial_ends_at: "2020-01-01T00:00:00.000Z", // well in the past
    }),
    false,
  );
});

test("hasProAccess: tier=free + override_tier='pro' → true", () => {
  // The override-resolved effectiveTier='pro' is the admin's explicit grant.
  // A free restaurant has subscription_status='none'; the override bypasses
  // the subscription check because it is an admin-issued entitlement.
  const r = restaurant("free");
  const override = makeOverride({ override_tier: "pro" });
  const activeOverride = pickActiveOverride([override], now);
  assert.ok(activeOverride !== null);
  const overrideLimits = resolveEffectiveLimits(r.tier, activeOverride);

  // hasProAccess checks effectiveTier from overrideLimits; when effectiveTier
  // is 'pro' the function returns true regardless of subscription_status
  // because the override is itself the access grant.
  assert.equal(hasProAccess(r, overrideLimits), true);
});

test("hasProAccess: tier=starter + no override → false", () => {
  assert.equal(
    hasProAccess({
      tier: "starter",
      subscription_status: "active",
      trial_ends_at: null,
    }),
    false,
  );
});

test("hasProAccess: backward-compatible — subscription_status omitted defaults to 'none'", () => {
  // Old callers that do not pass subscription_status must not accidentally gain Pro.
  assert.equal(
    hasProAccess({
      tier: "pro",
      trial_ends_at: null,
      // subscription_status intentionally omitted
    }),
    false,
  );
});
