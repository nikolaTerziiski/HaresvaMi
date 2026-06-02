/**
 * Pure composition tests for the override-aware canUseReputation path.
 *
 * These tests do NOT hit the database — they exercise the pure functions
 * hasProAccess and resolveEffectiveLimits (+ pickActiveOverride) directly,
 * mirroring the composition used by lib/billing/entitlements#canUseReputation.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { hasProAccess } from "@/lib/billing/entitlements-core";
import {
  pickActiveOverride,
  resolveEffectiveLimits,
  type PlanOverrideRow,
} from "@/lib/billing/overrides";

const now = new Date("2026-05-29T12:00:00.000Z");

/** Minimal restaurant shape accepted by hasProAccess. */
function restaurant(
  tier: string,
  subscription_status = "none",
  trial_ends_at: string | null = null,
) {
  return { tier, subscription_status, trial_ends_at };
}

/** Build a minimal PlanOverrideRow that is active at `now`. */
function activeOverrideRow(override_tier: string | null): PlanOverrideRow {
  return {
    id: "override-1",
    restaurant_id: "restaurant-1",
    override_tier,
    override_feedback_limit: null,
    override_scan_limit: null,
    reason: "test",
    granted_by: "admin",
    starts_at: "2026-01-01T00:00:00.000Z",
    expires_at: null, // no expiry — always active
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

/** Build a PlanOverrideRow that has already expired. */
function expiredOverrideRow(override_tier: string | null): PlanOverrideRow {
  return {
    id: "override-2",
    restaurant_id: "restaurant-1",
    override_tier,
    override_feedback_limit: null,
    override_scan_limit: null,
    reason: "test",
    granted_by: "admin",
    starts_at: "2026-01-01T00:00:00.000Z",
    expires_at: "2026-03-01T00:00:00.000Z", // expired before `now`
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

// ---------------------------------------------------------------------------
// free tier + active override_tier='pro' → true
// ---------------------------------------------------------------------------
test("free tier with active pro override returns hasProAccess=true", () => {
  const r = restaurant("free");
  const overrides = [activeOverrideRow("pro")];

  const activeOverride = pickActiveOverride(overrides, now);
  assert.ok(activeOverride, "should find an active override");

  const overrideLimits = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(
    overrideLimits.effectiveTier,
    "pro",
    "effectiveTier should be pro",
  );

  const result = hasProAccess(r, overrideLimits);
  assert.equal(
    result,
    true,
    "free + active pro override should grant Pro access",
  );
});

// ---------------------------------------------------------------------------
// free tier + no override → false
// ---------------------------------------------------------------------------
test("free tier with no override returns hasProAccess=false", () => {
  const r = restaurant("free");
  const overrides: PlanOverrideRow[] = [];

  const activeOverride = pickActiveOverride(overrides, now);
  assert.equal(activeOverride, null, "should have no active override");

  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(r.tier, activeOverride)
    : undefined;

  const result = hasProAccess(r, overrideLimits);
  assert.equal(result, false, "free + no override should deny Pro access");
});

// ---------------------------------------------------------------------------
// free tier + expired pro override → false
// ---------------------------------------------------------------------------
test("free tier with expired pro override returns hasProAccess=false", () => {
  const r = restaurant("free");
  const overrides = [expiredOverrideRow("pro")];

  const activeOverride = pickActiveOverride(overrides, now);
  assert.equal(
    activeOverride,
    null,
    "expired override must not be picked as active",
  );

  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(r.tier, activeOverride)
    : undefined;

  const result = hasProAccess(r, overrideLimits);
  assert.equal(result, false, "free + expired override should deny Pro access");
});

// ---------------------------------------------------------------------------
// pro + subscription_status='active' → true
// ---------------------------------------------------------------------------
test("pro tier with active subscription returns hasProAccess=true", () => {
  const r = restaurant("pro", "active");
  const overrides: PlanOverrideRow[] = [];

  const activeOverride = pickActiveOverride(overrides, now);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(r.tier, activeOverride)
    : undefined;

  const result = hasProAccess(r, overrideLimits);
  assert.equal(
    result,
    true,
    "pro + active subscription should grant Pro access",
  );
});

// ---------------------------------------------------------------------------
// pro + subscription_status='canceled' → false
// ---------------------------------------------------------------------------
test("pro tier with canceled subscription returns hasProAccess=false", () => {
  const r = restaurant("pro", "canceled");
  const overrides: PlanOverrideRow[] = [];

  const activeOverride = pickActiveOverride(overrides, now);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(r.tier, activeOverride)
    : undefined;

  const result = hasProAccess(r, overrideLimits);
  assert.equal(
    result,
    false,
    "pro + canceled subscription should deny Pro access",
  );
});

// ---------------------------------------------------------------------------
// active trial (any tier) → true, regardless of override
// ---------------------------------------------------------------------------
test("active trial returns hasProAccess=true regardless of tier", () => {
  const futureTrialEnd = "2026-12-31T00:00:00.000Z";
  const r = restaurant("free", "trialing", futureTrialEnd);

  const result = hasProAccess(r, undefined);
  assert.equal(result, true, "active trial should grant Pro access");
});

// ---------------------------------------------------------------------------
// starter tier + active starter override → false (starter is not pro)
// ---------------------------------------------------------------------------
test("starter tier with active starter override returns hasProAccess=false", () => {
  const r = restaurant("starter", "active");
  const overrides = [activeOverrideRow("starter")];

  const activeOverride = pickActiveOverride(overrides, now);
  assert.ok(activeOverride, "should find an active override");

  const overrideLimits = resolveEffectiveLimits(r.tier, activeOverride);
  assert.equal(overrideLimits.effectiveTier, "starter");

  const result = hasProAccess(r, overrideLimits);
  assert.equal(result, false, "starter override should NOT grant Pro access");
});
