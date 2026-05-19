import { redirect } from "next/navigation";

import { InsightsOverview } from "@/components/dashboard/insights/InsightsOverview";
import { hasProAccess } from "@/lib/billing/entitlements";
import {
  getDishTrendData,
  getInsightsDashboardData,
} from "@/lib/insights/dashboard";
import type { InsightPeriodKey } from "@/lib/insights/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Прозрения | HaresvaMi",
};

const VALID_PERIODS: InsightPeriodKey[] = ["week", "month", "custom"];

function validatePeriod(value: string | undefined): InsightPeriodKey {
  if (value && (VALID_PERIODS as string[]).includes(value)) {
    return value as InsightPeriodKey;
  }

  return "week";
}

export default async function InsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const period = validatePeriod(params.period);
  const data = await getInsightsDashboardData({
    period,
    from: params.from,
    to: params.to,
  });

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  const { candidates } = await getDishTrendData(data.restaurant.id);

  const trialActive =
    data.restaurant.trial_ends_at != null &&
    new Date(data.restaurant.trial_ends_at).getTime() > Date.now();

  let initialAiSummary: { summaryText: string; generatedAt: string } | null =
    null;

  if (
    hasProAccess({
      tier: data.restaurant.tier,
      trial_ends_at: data.restaurant.trial_ends_at,
    })
  ) {
    const supabase = await createSupabaseServerClient();
    const periodStart = data.period.currentFrom.slice(0, 10);
    const periodEnd = data.period.currentTo.slice(0, 10);

    const { data: cached } = await supabase
      .from("insight_summaries")
      .select("summary_text, generated_at")
      .eq("restaurant_id", data.restaurant.id)
      .eq("period_start", periodStart)
      .eq("period_end", periodEnd)
      .maybeSingle();

    if (cached) {
      initialAiSummary = {
        summaryText: cached.summary_text,
        generatedAt: cached.generated_at,
      };
    }
  }

  return (
    <InsightsOverview
      data={data}
      trendCandidates={candidates}
      trialActive={trialActive}
      initialAiSummary={initialAiSummary}
    />
  );
}
