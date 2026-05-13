import { redirect } from "next/navigation";

import { InsightsOverview } from "@/components/dashboard/insights/InsightsOverview";
import { getInsightsDashboardData } from "@/lib/insights/dashboard";

export const metadata = {
  title: "Прозрения | HaresvaMi",
};

export default async function InsightsPage() {
  const data = await getInsightsDashboardData();

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  return <InsightsOverview data={data} />;
}
