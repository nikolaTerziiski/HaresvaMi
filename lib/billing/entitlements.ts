import "server-only";

import {
  applySuccessfulEntitlementConsumption,
  emptyEntitlementResult,
  getFeedbackEntitlement,
  getMenuExtractionEntitlement,
  getScanEntitlement,
  hasProAccess,
  shouldConsumeScanCreditGrant,
  type EntitlementReason,
  type EntitlementResult,
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
  const [restaurant, usage] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  return getFeedbackEntitlement({
    restaurant,
    usage,
  });
}

export async function canScanReceipt(
  restaurantId: string,
): Promise<EntitlementResult> {
  const [restaurant, usage, creditSummary] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
    getActiveScanCreditSummary(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  return getScanEntitlement({
    restaurant,
    usage,
    creditSummary,
  });
}

export async function canExtractMenu(
  restaurantId: string,
): Promise<EntitlementResult> {
  const [restaurant, usage] = await Promise.all([
    getRestaurantEntitlementRow(restaurantId),
    getMonthlyUsage(restaurantId),
  ]);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  return getMenuExtractionEntitlement({
    restaurant,
    usage,
  });
}

export async function consumeAiScanCredit(
  restaurantId: string,
): Promise<EntitlementResult> {
  const entitlement = await canScanReceipt(restaurantId);

  if (!entitlement.allowed) {
    return entitlement;
  }

  const usage = await getMonthlyUsage(restaurantId);
  const restaurant = await getRestaurantEntitlementRow(restaurantId);

  if (!restaurant) {
    return emptyEntitlementResult("restaurant_not_found");
  }

  if (
    shouldConsumeScanCreditGrant({
      restaurant: restaurant as RestaurantEntitlementState,
      usage,
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
