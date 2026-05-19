import { NextRequest, NextResponse } from "next/server";

import { generateInsightSummary } from "@/lib/ai/generate-insights";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { hasProAccess } from "@/lib/billing/entitlements";
import { buildWeeklyInsights } from "@/lib/insights/aggregation";
import {
  countCompletedInsightSessions,
  loadInsightMenuItems,
  loadInsightRatings,
  loadInsightSessions,
} from "@/lib/insights/queries";
import type { InsightPeriod } from "@/lib/insights/types";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";

type RequestBody = {
  period: InsightPeriod;
  force?: boolean;
};

const CACHE_TTL_DAYS = 7;
const MIN_SESSIONS = 10;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { user, restaurant } = await getCurrentOwnerState();

  if (!user || !restaurant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: restaurantRow, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, name, tier, trial_ends_at")
    .eq("id", restaurant.id)
    .single();

  if (restaurantError || !restaurantRow) {
    return NextResponse.json(
      { error: "restaurant_not_found" },
      { status: 404 },
    );
  }

  if (!hasProAccess(restaurantRow)) {
    return NextResponse.json({ error: "pro_required" }, { status: 402 });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { period, force = false } = body;

  if (
    !period?.key ||
    !period.currentFrom ||
    !period.currentTo ||
    !period.previousFrom ||
    !period.previousTo
  ) {
    return NextResponse.json({ error: "invalid_period" }, { status: 400 });
  }

  const periodStart = period.currentFrom.slice(0, 10);
  const periodEnd = period.currentTo.slice(0, 10);

  if (!force) {
    const { data: cached } = await supabase
      .from("insight_summaries")
      .select("summary_text, generated_at")
      .eq("restaurant_id", restaurant.id)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .maybeSingle();

    if (cached) {
      const ageMs = Date.now() - new Date(cached.generated_at).getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays < CACHE_TTL_DAYS) {
        return NextResponse.json({
          summaryText: cached.summary_text,
          generatedAt: cached.generated_at,
          cached: true,
        });
      }
    }
  }

  const [sessions, menuItems, allCompletedSessions] = await Promise.all([
    loadInsightSessions({
      restaurantId: restaurant.id,
      from: period.previousFrom,
      to: period.currentTo,
    }),
    loadInsightMenuItems(restaurant.id),
    countCompletedInsightSessions(restaurant.id),
  ]);

  const ratings = await loadInsightRatings(sessions.map((s) => s.id));

  const now = new Date(period.currentTo);
  const insights = buildWeeklyInsights({
    sessions,
    ratings,
    menuItems,
    allCompletedSessions,
    now,
  });

  if (insights.current.completedSessions < MIN_SESSIONS) {
    return NextResponse.json(
      {
        error: "not_enough_data",
        required: MIN_SESSIONS,
        current: insights.current.completedSessions,
      },
      { status: 422 },
    );
  }

  let summaryText: string;
  let generatedAt: string;

  try {
    const result = await generateInsightSummary({
      restaurantId: restaurant.id,
      restaurantName: restaurantRow.name,
      period,
      current: insights.current,
      previous: insights.previous,
      topPerformer: insights.topPerformer,
      watchDish: insights.watchDish,
      improvedDish: insights.improvedDish,
    });

    summaryText = result.summaryText;
    generatedAt = new Date().toISOString();
  } catch (err) {
    console.error(
      "Insight generation failed:",
      err instanceof Error ? err.message : "unknown error",
    );

    return NextResponse.json(
      {
        error: "ai_failed",
        message:
          "Не можахме да генерираме резюме сега. Опитай отново след малко.",
      },
      { status: 502 },
    );
  }

  const serviceClient = createSupabaseServiceClient();
  await serviceClient.from("insight_summaries").upsert(
    {
      restaurant_id: restaurant.id,
      period_start: periodStart,
      period_end: periodEnd,
      summary_text: summaryText,
      generated_at: generatedAt,
    },
    { onConflict: "restaurant_id,period_start,period_end" },
  );

  return NextResponse.json({
    summaryText,
    generatedAt,
    cached: false,
  });
}
