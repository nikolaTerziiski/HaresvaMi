import { redirect } from "next/navigation";

import { InsightsOverview } from "@/components/dashboard/insights/InsightsOverview";
import {
  getDishTrendData,
  getInsightsDashboardData,
} from "@/lib/insights/dashboard";
import type { InsightPeriodKey } from "@/lib/insights/types";

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

  return <InsightsOverview data={data} trendCandidates={candidates} />;
}
