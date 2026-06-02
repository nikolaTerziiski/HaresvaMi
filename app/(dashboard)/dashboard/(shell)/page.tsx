import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { GetStartedChecklist } from "@/components/dashboard/home/GetStartedChecklist";
import { HomeAppNudge } from "@/components/dashboard/home/HomeAppNudge";
import { LatestInsightBanner } from "@/components/dashboard/LatestInsightBanner";
import { DASHBOARD_PAGE_FRAME_CLASS } from "@/components/dashboard/shell/page-frame";
import { getDashboardHomeData } from "@/lib/dashboard/home";
import { getLatestInsightSummary } from "@/lib/dashboard/signals";

export default async function DashboardHomePage() {
  const data = await getDashboardHomeData();

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  const latestInsight = await getLatestInsightSummary(data.restaurant.id);

  const t = await getTranslations("dashboard.home");

  return (
    <div className={DASHBOARD_PAGE_FRAME_CLASS}>
      <LatestInsightBanner summary={latestInsight} />
      <section className="max-w-[520px]">
        <h2 className="m-0 mb-3 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[34px]">
          {t("welcome.title")}
        </h2>
        <p className="m-0 max-w-[520px] text-[16px] text-[var(--ink-mute)]">
          {t("welcome.subtitle")}
        </p>
      </section>

      <GetStartedChecklist data={data} />

      <HomeAppNudge />
    </div>
  );
}
