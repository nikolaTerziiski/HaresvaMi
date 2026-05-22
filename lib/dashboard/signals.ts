import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type InsightSummary = {
  summary_text: string;
  period_start: string;
  period_end: string;
  generated_at: string;
};

/**
 * Returns true when the restaurant has at least one completed feedback session.
 * Used to gate the PushOptIn and PwaInstallPrompt on the dashboard home.
 */
export async function hasCompletedFeedback(
  restaurantId: string,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("feedback_sessions")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .not("completed_at", "is", null);

  return (count ?? 0) > 0;
}

/**
 * Returns true when the restaurant has at least one active kiosk session.
 * Used to gate the PwaInstallPrompt on the tablet page.
 *
 * A session counts only when status = 'active' AND expires_at is in the future.
 * The kiosk_sessions table has no revoked_at column — use the status field instead.
 * Note: if Supabase generated types are stale, regen with `npx supabase gen types`.
 */
export async function hasKioskSession(restaurantId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { count } = await supabase
    .from("kiosk_sessions")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("status", "active")
    .gt("expires_at", new Date().toISOString());

  return (count ?? 0) > 0;
}

/**
 * Returns the most recent insight summary for the given restaurant.
 * Returns null if none exists.
 */
export async function getLatestInsightSummary(
  restaurantId: string,
): Promise<InsightSummary | null> {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("insight_summaries")
    .select("summary_text, period_start, period_end, generated_at")
    .eq("restaurant_id", restaurantId)
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}
