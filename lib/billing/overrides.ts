/**
 * Plan override resolution helpers.
 *
 * A plan_overrides row lets an admin adjust a restaurant's effective tier and/or
 * individual limits without changing restaurants.tier directly. This module
 * contains the pure resolution logic; the actual DB fetch lives in entitlements.ts.
 *
 * Rules:
 *   - effective_tier         = override_tier ?? restaurant.tier
 *   - effective_feedback_limit = override_feedback_limit ?? plans limit for effective_tier
 *   - effective_scan_limit   = override_scan_limit    ?? plans limit for effective_tier
 */

import {
  getAiScanLimit,
  getFeedbackLimit,
  isPlanTier,
  type PlanTier,
} from "@/lib/billing/plans";

/** Shape of a row returned from the plan_overrides table. */
export type PlanOverrideRow = {
  id: string;
  restaurant_id: string;
  override_tier: string | null;
  override_feedback_limit: number | null;
  override_scan_limit: number | null;
  reason: string;
  granted_by: string;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
};

/** The resolved effective limits after applying any active override. */
export type ResolvedLimits = {
  /** Effective tier — may differ from restaurants.tier when override_tier is set. */
  effectiveTier: PlanTier;
  /** Monthly feedback session limit in effect. */
  effectiveFeedbackLimit: number;
  /** Monthly AI scan limit in effect. */
  effectiveScanLimit: number;
  /** Whether any override is currently active. */
  hasOverride: boolean;
};

/**
 * Returns the most recently created active override from a list.
 *
 * "Active" means: starts_at <= now AND (expires_at IS NULL OR expires_at > now).
 * If multiple qualify, the one with the largest created_at wins.
 */
export function pickActiveOverride(
  overrides: PlanOverrideRow[],
  now = new Date(),
): PlanOverrideRow | null {
  const active = overrides.filter((o) => {
    const started = new Date(o.starts_at).getTime() <= now.getTime();
    const notExpired =
      o.expires_at === null || new Date(o.expires_at).getTime() > now.getTime();
    return started && notExpired;
  });

  if (active.length === 0) return null;

  // Most recently created wins.
  return active.reduce((best, candidate) =>
    new Date(candidate.created_at).getTime() >
    new Date(best.created_at).getTime()
      ? candidate
      : best,
  );
}

/**
 * Computes the effective tier and limits given the restaurant's stored tier
 * and an optional active override row.
 *
 * @param restaurantTier - The tier stored on the restaurants row.
 * @param activeOverride - The active plan_overrides row, or null for no override.
 */
export function resolveEffectiveLimits(
  restaurantTier: string,
  activeOverride: PlanOverrideRow | null,
): ResolvedLimits {
  const baseTier: PlanTier = isPlanTier(restaurantTier)
    ? restaurantTier
    : "free";

  if (activeOverride === null) {
    return {
      effectiveTier: baseTier,
      effectiveFeedbackLimit: getFeedbackLimit(baseTier),
      effectiveScanLimit: getAiScanLimit(baseTier),
      hasOverride: false,
    };
  }

  const effectiveTier: PlanTier = isPlanTier(activeOverride.override_tier ?? "")
    ? (activeOverride.override_tier as PlanTier)
    : baseTier;

  return {
    effectiveTier,
    effectiveFeedbackLimit:
      activeOverride.override_feedback_limit ?? getFeedbackLimit(effectiveTier),
    effectiveScanLimit:
      activeOverride.override_scan_limit ?? getAiScanLimit(effectiveTier),
    hasOverride: true,
  };
}
