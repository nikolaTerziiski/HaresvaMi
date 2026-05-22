/**
 * Tests for Bug A fix: consumeAiScanCredit with plan overrides.
 *
 * Scenario: a Free restaurant has an admin override that raises its scan limit
 * to 999. The consume path must NOT attempt to consume a credit grant when the
 * restaurant is still within the override-adjusted limit.
 *
 * These tests exercise the pure logic layer (entitlements-core) rather than
 * the async DB layer, since the DB calls in entitlements.ts cannot be mocked
 * without a running Supabase instance.
 */

import assert from "node:assert/strict";
import test from "node:test";

import {
  shouldConsumeScanCreditGrant,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import {
  resolveEffectiveLimits,
  type PlanOverrideRow,
} from "@/lib/billing/overrides";

const now = new Date("2026-04-25T12:00:00.000Z");

function freeRestaurant(
  overrides: Partial<RestaurantEntitlementState> = {},
): RestaurantEntitlementState {
  return {
    id: "restaurant-free",
    tier: "free",
    subscription_status: "none",
    current_period_ends_at: null,
    trial_ends_at: null,
    ...overrides,
  };
}

function makeOverride(partial: Partial<PlanOverrideRow> = {}): PlanOverrideRow {
  return {
    id: "override-1",
    restaurant_id: "restaurant-free",
    override_tier: null,
    override_feedback_limit: null,
    override_scan_limit: null,
    reason: "internal test grant",
    granted_by: "admin-uuid",
    starts_at: "2026-04-01T00:00:00.000Z",
    expires_at: null,
    created_at: "2026-04-01T00:00:00.000Z",
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Bug A core: shouldConsumeScanCreditGrant must use the effective (override)
// limit, not the base plan limit.
// ---------------------------------------------------------------------------

test("shouldConsumeScanCreditGrant returns false when usage is below override limit", () => {
  const restaurant = freeRestaurant();
  // Free base limit is 5; override raises it to 999.
  const override = makeOverride({ override_scan_limit: 999 });
  const overrideLimits = resolveEffectiveLimits(restaurant.tier, override);
  assert.equal(overrideLimits.effectiveScanLimit, 999);

  // Usage 6 is above the free base limit (5) but below the override limit (999).
  // Without the fix, shouldConsumeScanCreditGrant would return true here,
  // causing the consume path to try to consume a non-existent grant and return 402.
  const result = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 6, menuExtractionCount: 0 },
    overrideLimits,
    now,
  });

  assert.equal(
    result,
    false,
    "Usage (6) is within the override scan limit (999); no credit grant should be consumed",
  );
});

test("shouldConsumeScanCreditGrant returns false when usage equals free base limit but override is higher", () => {
  const restaurant = freeRestaurant();
  const override = makeOverride({ override_scan_limit: 999 });
  const overrideLimits = resolveEffectiveLimits(restaurant.tier, override);

  // Usage exactly at the base free limit (5) — would trigger grant without the fix.
  const result = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 5, menuExtractionCount: 0 },
    overrideLimits,
    now,
  });

  assert.equal(result, false);
});

test("shouldConsumeScanCreditGrant returns true when usage meets or exceeds the override limit", () => {
  const restaurant = freeRestaurant();
  const override = makeOverride({ override_scan_limit: 10 });
  const overrideLimits = resolveEffectiveLimits(restaurant.tier, override);

  const atLimit = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 10, menuExtractionCount: 0 },
    overrideLimits,
    now,
  });
  const overLimit = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 15, menuExtractionCount: 0 },
    overrideLimits,
    now,
  });

  assert.equal(
    atLimit,
    true,
    "Usage at override limit should trigger grant consumption",
  );
  assert.equal(
    overLimit,
    true,
    "Usage above override limit should trigger grant consumption",
  );
});

test("shouldConsumeScanCreditGrant without override uses base plan limit", () => {
  // Free base limit = 5. No override.
  const restaurant = freeRestaurant();

  const belowLimit = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 4, menuExtractionCount: 0 },
    now,
  });
  const atLimit = shouldConsumeScanCreditGrant({
    restaurant,
    usage: { feedbackCount: 0, aiScanCount: 5, menuExtractionCount: 0 },
    now,
  });

  assert.equal(belowLimit, false);
  assert.equal(atLimit, true);
});

test("shouldConsumeScanCreditGrant returns true during active trial regardless of override", () => {
  const trialRestaurant = freeRestaurant({
    subscription_status: "trialing",
    trial_ends_at: "2026-05-09T12:00:00.000Z",
  });
  const override = makeOverride({ override_scan_limit: 999 });
  const overrideLimits = resolveEffectiveLimits(trialRestaurant.tier, override);

  const result = shouldConsumeScanCreditGrant({
    restaurant: trialRestaurant,
    usage: { feedbackCount: 0, aiScanCount: 0, menuExtractionCount: 0 },
    overrideLimits,
    now,
  });

  // Trial always consumes from credit grant (trial credits are the mechanism).
  assert.equal(result, true);
});
