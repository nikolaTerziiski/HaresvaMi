import { redirect } from "next/navigation";

import { FeedbackOverview } from "@/components/dashboard/feedback/FeedbackOverview";
import { getFeedbackDashboardData } from "@/lib/feedback/dashboard";

export default async function FeedbackPage() {
  const data = await getFeedbackDashboardData();

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  return <FeedbackOverview data={data} />;
}
