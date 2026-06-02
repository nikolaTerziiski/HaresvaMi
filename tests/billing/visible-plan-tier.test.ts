import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveVisiblePlanTier,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import {
  pickActiveOverride,
  resolveEffectiveLimits,
  type PlanOverrideRow,
} from "@/lib/billing/overrides";

const now = new Date("2026-05-29T12:00:00.000Z");

function restaurant(
  tier: string,
  subscription_status: string,
  overrides: Partial<RestaurantEntitlementState> = {},
): RestaurantEntitlementState {
  return {
    id: "restaurant-1",
    tier,
    subscription_status,
    current_period_ends_at: null,
    trial_ends_at: null,
    ...overrides,
  };
}

function overrideRow(override_tier: string | null): PlanOverrideRow {
  return {
    id: "override-1",
    restaurant_id: "restaurant-1",
    override_tier,
    override_feedback_limit: null,
    override_scan_limit: null,
    reason: "test",
    granted_by: "admin",
    starts_at: "2026-01-01T00:00:00.000Z",
    expires_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

test("visible plan tier shows active Pro subscriptions as Pro", () => {
  assert.equal(
    resolveVisiblePlanTier(restaurant("pro", "active"), undefined, now),
    "pro",
  );
});

test("visible plan tier falls back when a Pro subscription is canceled", () => {
  assert.equal(
    resolveVisiblePlanTier(restaurant("pro", "canceled"), undefined, now),
    "free",
  );
});

test("visible plan tier shows active trial access as Pro", () => {
  assert.equal(
    resolveVisiblePlanTier(
      restaurant("free", "trialing", {
        trial_ends_at: "2026-06-12T12:00:00.000Z",
      }),
      undefined,
      now,
    ),
    "pro",
  );
});

test("visible plan tier respects an active Pro override", () => {
  const base = restaurant("free", "none");
  const activeOverride = pickActiveOverride([overrideRow("pro")], now);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(base.tier, activeOverride)
    : undefined;

  assert.equal(resolveVisiblePlanTier(base, overrideLimits, now), "pro");
});

test("visible plan tier keeps active Starter subscriptions as Starter", () => {
  assert.equal(
    resolveVisiblePlanTier(restaurant("starter", "active"), undefined, now),
    "starter",
  );
});
