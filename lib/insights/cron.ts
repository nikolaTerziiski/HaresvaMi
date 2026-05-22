import "server-only";

import { generateInsightSummary } from "@/lib/ai/generate-insights";
import { buildInsights } from "@/lib/insights/aggregation";
import { resolveInsightPeriod } from "@/lib/insights/period";
import {
  loadInsightMenuItems,
  loadInsightRatings,
  loadInsightSessions,
} from "@/lib/insights/queries";
import {
  getEligibleRestaurants,
  hasEnoughRatings,
  type EligibleRestaurant,
} from "@/lib/insights/scheduling";
import { buildInsightPayload } from "@/lib/push/payload";
import { sendPush } from "@/lib/push/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export type CronRestaurantResult = {
  restaurantId: string;
  status: "ok" | "skipped" | "failed";
  pushSent: number;
  pushPruned: number;
  failureReason?: string;
};

export type CronRunResult = {
  processed: number;
  pushSent: number;
  pushPruned: number;
  results: CronRestaurantResult[];
};

/** Concurrency pool: run tasks with at most `limit` in flight at once. */
async function poolAll<T>(
  tasks: Array<() => Promise<T>>,
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    if (index >= tasks.length) return;
    const taskIndex = index++;
    results[taskIndex] = await tasks[taskIndex]();
    await runNext();
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () =>
    runNext(),
  );
  await Promise.all(workers);

  return results;
}

async function processRestaurant(
  restaurant: EligibleRestaurant,
): Promise<CronRestaurantResult> {
  const base: CronRestaurantResult = {
    restaurantId: restaurant.id,
    status: "ok",
    pushSent: 0,
    pushPruned: 0,
  };

  const now = new Date();
  const period = resolveInsightPeriod({ key: "week", now });

  // Check minimum rating threshold.
  const enough = await hasEnoughRatings(
    restaurant.id,
    period.currentFrom,
    period.currentTo,
  );

  if (!enough) {
    return { ...base, status: "skipped" };
  }

  // Load data and build insights.
  const [sessions, menuItems, allCompletedCount] = await Promise.all([
    loadInsightSessions({
      restaurantId: restaurant.id,
      from: period.previousFrom,
      to: period.currentTo,
    }),
    loadInsightMenuItems(restaurant.id),
    (async () => {
      const supabase = createSupabaseServiceClient();
      const { count } = await supabase
        .from("feedback_sessions")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurant.id)
        .not("completed_at", "is", null);
      return count ?? 0;
    })(),
  ]);

  const sessionIds = sessions.map((s) => s.id);
  const ratings = await loadInsightRatings(sessionIds);

  const insights = buildInsights({
    sessions,
    ratings,
    menuItems,
    allCompletedSessions: allCompletedCount,
    period,
  });

  // Generate the AI summary.
  const { summaryText } = await generateInsightSummary({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    period: insights.period,
    current: insights.current,
    previous: insights.previous,
    topPerformer: insights.topPerformer,
    watchDish: insights.watchDish,
    improvedDish: insights.improvedDish,
  });

  // Upsert insight_summaries.
  const supabase = createSupabaseServiceClient();
  const periodStart = period.currentFrom.substring(0, 10);
  const periodEnd = period.currentTo.substring(0, 10);

  await supabase.from("insight_summaries").upsert(
    {
      restaurant_id: restaurant.id,
      period_start: periodStart,
      period_end: periodEnd,
      summary_text: summaryText,
      generated_at: now.toISOString(),
    },
    { onConflict: "restaurant_id,period_start,period_end" },
  );

  // Fetch push subscriptions and send.
  const { data: subscriptions } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("restaurant_id", restaurant.id);

  const subs = subscriptions ?? [];
  const payload = buildInsightPayload(restaurant.name, summaryText);
  let pushSent = 0;
  let pushPruned = 0;
  const successIds: string[] = [];
  const goneIds: string[] = [];

  for (const sub of subs) {
    const result = await sendPush(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      payload,
    );

    if (result.ok) {
      pushSent++;
      successIds.push(sub.id);
    } else if (result.gone) {
      pushPruned++;
      goneIds.push(sub.id);
    }
  }

  // Delete gone subscriptions.
  if (goneIds.length > 0) {
    await supabase.from("push_subscriptions").delete().in("id", goneIds);
  }

  // Update last_used_at for successful sends.
  if (successIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ last_used_at: now.toISOString() })
      .in("id", successIds);
  }

  // Log AI usage event for the cron run (metadata only).
  await supabase
    .from("ai_usage_events")
    .insert({
      restaurant_id: restaurant.id,
      event_type: "weekly_insight_generation",
      model: "gemini-2.5-flash-lite",
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      success: true,
    })
    .then(({ error }) => {
      if (error) {
        console.error(
          `Failed to log cron ai_usage_event for ${restaurant.id}:`,
          error,
        );
      }
    });

  console.log(
    `[weekly-insights] ${restaurant.id} ok | push_sent=${pushSent} push_pruned=${pushPruned}`,
  );

  return { ...base, status: "ok", pushSent, pushPruned };
}

export async function runWeeklyInsightsCron(): Promise<CronRunResult> {
  const restaurants = await getEligibleRestaurants();

  const tasks = restaurants.map(
    (restaurant) => () =>
      processRestaurant(restaurant).catch((err): CronRestaurantResult => {
        const reason = err instanceof Error ? err.message : String(err);
        console.error(
          `[weekly-insights] Failed for restaurant ${restaurant.id}:`,
          reason,
        );
        return {
          restaurantId: restaurant.id,
          status: "failed",
          pushSent: 0,
          pushPruned: 0,
          failureReason: reason,
        };
      }),
  );

  const results = await poolAll(tasks, 5);

  const processed = results.filter((r) => r.status === "ok").length;
  const pushSent = results.reduce((acc, r) => acc + r.pushSent, 0);
  const pushPruned = results.reduce((acc, r) => acc + r.pushPruned, 0);

  return { processed, pushSent, pushPruned, results };
}
