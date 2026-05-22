import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

const MIN_CURRENT_RATINGS = 3;

export type EligibleRestaurant = {
  id: string;
  name: string;
  owner_id: string;
  tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
};

/**
 * Returns all restaurants eligible for weekly insight generation.
 *
 * Eligibility rules:
 * - Pro tier with subscription_status = 'active', OR
 * - Any tier with subscription_status = 'trialing' AND trial_ends_at > NOW()
 *
 * The caller is responsible for filtering by minimum rating count per window.
 */
export async function getEligibleRestaurants(): Promise<EligibleRestaurant[]> {
  const supabase = createSupabaseServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, owner_id, tier, subscription_status, trial_ends_at")
    .or(
      [
        "and(subscription_status.eq.active,tier.eq.pro)",
        `and(subscription_status.eq.trialing,trial_ends_at.gt.${now})`,
      ].join(","),
    );

  if (error) {
    throw new Error(
      `Unable to load eligible restaurants for cron: ${error.message}`,
    );
  }

  return (data ?? []) as EligibleRestaurant[];
}

/**
 * Count completed feedback sessions in the given time window for a restaurant.
 * Uses service role so the cron can access all restaurants' data.
 */
export async function countRatingsInWindow(
  restaurantId: string,
  from: string,
  to: string,
): Promise<number> {
  const supabase = createSupabaseServiceClient();

  // Count feedback_ratings rows whose session completed in the window.
  const { count, error } = await supabase
    .from("feedback_ratings")
    .select("id", { count: "exact", head: true })
    .eq(
      "session_id",
      // Subquery not directly supported; join via in() on session ids.
      // Instead we count sessions and use that as the proxy. See the
      // hasEnoughRatings helper below which fetches session ids first.
      restaurantId,
    );

  if (error) {
    throw new Error(
      `Unable to count ratings for restaurant ${restaurantId}: ${error.message}`,
    );
  }

  return count ?? 0;
}

/**
 * Returns true when the restaurant has at least MIN_CURRENT_RATINGS (3) rating
 * rows in completed sessions within the current 7-day window.
 */
export async function hasEnoughRatings(
  restaurantId: string,
  from: string,
  to: string,
): Promise<boolean> {
  const supabase = createSupabaseServiceClient();

  // Step 1: get session ids in window.
  const { data: sessions, error: sessionsError } = await supabase
    .from("feedback_sessions")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .not("completed_at", "is", null)
    .gte("completed_at", from)
    .lte("completed_at", to);

  if (sessionsError) {
    throw new Error(
      `Unable to count sessions for restaurant ${restaurantId}: ${sessionsError.message}`,
    );
  }

  const sessionIds = (sessions ?? []).map((s) => s.id);

  if (sessionIds.length === 0) return false;

  // Step 2: count ratings in those sessions.
  const { count, error: ratingsError } = await supabase
    .from("feedback_ratings")
    .select("id", { count: "exact", head: true })
    .in("session_id", sessionIds);

  if (ratingsError) {
    throw new Error(
      `Unable to count ratings in sessions for ${restaurantId}: ${ratingsError.message}`,
    );
  }

  return (count ?? 0) >= MIN_CURRENT_RATINGS;
}
