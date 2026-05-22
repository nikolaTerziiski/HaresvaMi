import "server-only";

import {
  applySuccessfulEntitlementConsumption,
  emptyEntitlementResult,
  getFeedbackEntitlement,
  getMenuExtractionEntitlement,
  getScanEntitlement,
  hasProAccess,
  pickActiveOverride,
  resolveEffectiveLimits,
  shouldConsumeScanCreditGrant,
  type EntitlementReason,
  type EntitlementResult,
  type PlanOverrideRow,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import {
  consumeActiveScanCreditGrant,
  getActiveScanCreditSummary,
  getCurrentUsagePeriod,
  getMonthlyUsage,
  incrementAiScanUsage,
  incrementFeedbackUsage as incrementMonthlyFeedbackUsage,
} from "@/lib/billing/usage";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export { getCurrentUsagePeriod, getMonthlyUsage, hasProAccess };
export type { EntitlementReason, EntitlementResult };

/**
 * Fetches all plan_overrides rows for a restaurant that may currently be active.
 * The caller is responsible for picking the winning row via pickActiveOverride().
 */
async function getPlanOverrideRows(
  restaurantId: string,
): Promise<PlanOverrideRow[]> {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("plan_overrides")
    .select(
      "id, restaurant_id, override_tier, override_feedback_limit, override_scan_limit, reason, granted_by, starts_at, expires_at, created_at",
    )
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    // Migration 0012 not yet applied: PostgREST returns "Could not find the
    // table 'public.plan_overrides' in the schema cache" with code PGRST205.
    // Degrade to "no override" so paid surfaces keep working until the
    // operator applies the migration.
    const code = (error as { code?: string }).code;
    if (code === "PGRST205" || error.message.includes("schema cache")) {
      console.warn(
        "[entitlements] plan_overrides table missing — apply migration 0012. Falling back to base plan.",
      );
      return [];
    }
    throw new Error(`Unable to read plan overrides: ${error.message}`);
  }

  return (data ?? []) as PlanOverrideRow[];
}

async function getRestaurantEntitlementRow(restaurantId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, tier, subscription_status, current_period_ends_at, trial_ends_at",
    )
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to read restaurant entitlement state: ${error.message}`,
    );
  }

  return data;
}

export async function canSubmitFeedback(
  restaurantId: string,
): Promise<EntitlementResult> {
  const [restaurant, usage, overrideRows] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
    getPlanOverrideRows(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  const activeOverride = pickActiveOverride(overrideRows);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(restaurant.tier, activeOverride)
    : undefined;

  return getFeedbackEntitlement({ restaurant, usage, overrideLimits });
}

export async function canScanReceipt(
  restaurantId: string,
): Promise<EntitlementResult> {
  const [restaurant, usage, creditSummary, overrideRows] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
    getActiveScanCreditSummary(restaurantId),
    getPlanOverrideRows(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  const activeOverride = pickActiveOverride(overrideRows);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(restaurant.tier, activeOverride)
    : undefined;

  return getScanEntitlement({
    restaurant,
    usage,
    creditSummary,
    overrideLimits,
  });
}

export async function canExtractMenu(
  restaurantId: string,
): Promise<EntitlementResult> {
  const [restaurant, usage, overrideRows] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
    getPlanOverrideRows(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  const activeOverride = pickActiveOverride(overrideRows);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(restaurant.tier, activeOverride)
    : undefined;

  return getMenuExtractionEntitlement({ restaurant, usage, overrideLimits });
}

export async function consumeAiScanCredit(
  restaurantId: string,
): Promise<EntitlementResult> {
  const entitlement = await canScanReceipt(restaurantId);

  if (!entitlement.allowed) {
    return entitlement;
  }

  const [usage, restaurant, overrideRows] = await Promise.all([
    getMonthlyUsage(restaurantId),
    getRestaurantEntitlementRow(restaurantId),
    getPlanOverrideRows(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  const activeOverride = pickActiveOverride(overrideRows);
  const overrideLimits = activeOverride
    ? resolveEffectiveLimits(restaurant.tier, activeOverride)
    : undefined;

  if (
    shouldConsumeScanCreditGrant({
      restaurant: restaurant as RestaurantEntitlementState,
      usage,
      overrideLimits,
    })
  ) {
    const consumedGrant = await consumeActiveScanCreditGrant(restaurantId);

    if (!consumedGrant) {
      return {
        ...entitlement,
        allowed: false,
        reason: "scan_credit_unavailable",
        remaining: 0,
        upgradeTarget: "pro",
      };
    }
  }

  await incrementAiScanUsage(restaurantId);

  return applySuccessfulEntitlementConsumption(entitlement);
}

export async function incrementFeedbackUsage(
  restaurantId: string,
): Promise<EntitlementResult> {
  const entitlement = await canSubmitFeedback(restaurantId);

  if (!entitlement.allowed) {
    return entitlement;
  }

  await incrementMonthlyFeedbackUsage(restaurantId);

  return applySuccessfulEntitlementConsumption(entitlement);
}
