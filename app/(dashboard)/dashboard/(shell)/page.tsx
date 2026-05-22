import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { GetStartedChecklist } from "@/components/dashboard/home/GetStartedChecklist";
import { LatestInsightBanner } from "@/components/dashboard/LatestInsightBanner";
import { PushOptIn } from "@/components/dashboard/PushOptIn";
import { TierCard } from "@/components/dashboard/home/TierCard";
import { TutorialCard } from "@/components/dashboard/home/TutorialCard";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { getDashboardHomeData } from "@/lib/dashboard/home";
import {
  getLatestInsightSummary,
  hasCompletedFeedback,
} from "@/lib/dashboard/signals";

export default async function DashboardHomePage() {
  const data = await getDashboardHomeData();

  if (!data) {
    redirect("/dashboard/onboarding");
  }

  const [completedFeedback, latestInsight] = await Promise.all([
    hasCompletedFeedback(data.restaurant.id),
    getLatestInsightSummary(data.restaurant.id),
  ]);

  const t = await getTranslations("dashboard.home");

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
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

      <div className="mt-6 grid gap-4">
        <PushOptIn show={completedFeedback} />
        <PwaInstallPrompt surface="dashboard" show={completedFeedback} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <TierCard used={data.usage.used} limit={data.usage.limit} />
        <TutorialCard />
      </div>
    </div>
  );
}
