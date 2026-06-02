import { hasProAccess } from "@/lib/billing/entitlements-core";

type RestaurantForReputation = {
  tier: string;
  subscription_status?: string;
  trial_ends_at: string | null;
};

/**
 * Pure synchronous base check (NOT override-aware): does this restaurant's own
 * subscription state grant Pro? Use the override-aware async
 * `canUseReputation(restaurantId)` from `@/lib/billing/entitlements` for gating
 * decisions — this helper exists only for pure, in-memory checks/tests.
 */
export function restaurantHasReputationAccess(
  restaurant: RestaurantForReputation,
): boolean {
  return hasProAccess(restaurant);
}
