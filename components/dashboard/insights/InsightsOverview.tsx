import { DishRankingTable } from "@/components/dashboard/insights/DishRankingTable";
import { DishTrendChart } from "@/components/dashboard/insights/DishTrendChart";
import { InsightHighlights } from "@/components/dashboard/insights/InsightHighlights";
import { InsightsAiSummary } from "@/components/dashboard/insights/InsightsAiSummary";
import { InsightsEmptyState } from "@/components/dashboard/insights/InsightsEmptyState";
import { InsightsSummary } from "@/components/dashboard/insights/InsightsSummary";
import { PeriodSwitcher } from "@/components/dashboard/insights/PeriodSwitcher";
import { DASHBOARD_PAGE_FRAME_CLASS } from "@/components/dashboard/shell/page-frame";
import type {
  DishCandidate,
  InsightsDashboardData,
} from "@/lib/insights/dashboard";
import type { InsightPeriodKey } from "@/lib/insights/types";

type InsightsOverviewProps = {
  data: InsightsDashboardData;
  trendCandidates: DishCandidate[];
  trialActive: boolean;
  initialAiSummary: {
    summaryText: string;
    generatedAt: string;
  } | null;
};

function formatDateRange(start: string, end: string) {
  const formatter = new Intl.DateTimeFormat("bg-BG", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Sofia",
  });

  return `${formatter.format(new Date(start))} - ${formatter.format(
    new Date(end),
  )}`;
}

const periodTitle: Record<InsightPeriodKey, string> = {
  week: "Какво да видиш тази седмица",
  month: "Какво да видиш този месец",
  custom: "Статистика за избрания период",
};

function periodSubtitle(
  key: InsightPeriodKey,
  restaurantName: string,
  range: string,
): string {
  const suffix =
    "Показваме само сигнали с достатъчно оценки, без измислени тенденции.";

  if (key === "week") {
    return `Последните 7 дни в ${restaurantName}: ${range}. ${suffix}`;
  }

  if (key === "month") {
    return `Последните 30 дни в ${restaurantName}: ${range}. ${suffix}`;
  }

  return `${range} в ${restaurantName}. ${suffix}`;
}

function comparisonHint(key: InsightPeriodKey): string {
  if (key === "week") {
    return "Сравнението с предишна седмица ще започне, когато има отзиви и в двата 7-дневни периода. Дотогава показваме само текущата седмица.";
  }

  if (key === "month") {
    return "Сравнението с предишния месец ще започне, когато има отзиви и в двата 30-дневни периода. Дотогава показваме само текущия месец.";
  }

  return "Сравнението с предишния период от същата дължина ще започне, когато има отзиви и в двата периода.";
}

function emptyStateFor(data: InsightsDashboardData) {
  if (data.menuItemCount === 0) return "no-menu";
  if (data.allCompletedSessions === 0) return "no-feedback";
  if (data.current.itemRatingCount < 3) return "not-enough-weekly-data";

  return null;
}

export function InsightsOverview({
  data,
  trendCandidates,
  trialActive,
  initialAiSummary,
}: InsightsOverviewProps) {
  const emptyState = emptyStateFor(data);
  const { period } = data;
  const currentRange = formatDateRange(period.currentFrom, period.currentTo);

  return (
    <div className={DASHBOARD_PAGE_FRAME_CLASS}>
      {/* Tier 0 — header + period control as one toolbar row */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section className="max-w-[720px]">
          <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
            Статистика
          </p>
          <h1 className="m-0 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
            {periodTitle[period.key]}
          </h1>
          <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--ink-2)]">
            {periodSubtitle(period.key, data.restaurant.name, currentRange)}
          </p>
        </section>
        <PeriodSwitcher
          currentKey={period.key}
          currentFrom={period.currentFrom}
          currentTo={period.currentTo}
        />
      </header>

      {emptyState ? (
        <div className="mt-10">
          <InsightsEmptyState kind={emptyState} />
        </div>
      ) : (
        <>
          {/* Tier 1 — the headline number row (focal point) */}
          <div className="mt-10">
            <InsightsSummary data={data} />
          </div>
          {!data.hasPreviousComparison ? (
            <p className="mt-3 text-[13px] leading-[1.5] text-[var(--ink-mute)]">
              {comparisonHint(period.key)}
            </p>
          ) : null}

          {/* Tier 1b — narrative directly under the numbers */}
          <div className="mt-8">
            <InsightsAiSummary
              period={period}
              tier={data.restaurant.tier ?? "free"}
              trialActive={trialActive}
              initialSummary={initialAiSummary}
            />
          </div>

          {/* Tier 2 — notable dishes (quiet supporting cards) */}
          <section className="mt-12">
            <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              Ястия за внимание
            </p>
            <div className="mt-4">
              <InsightHighlights data={data} />
            </div>
          </section>

          {/* Tier 3 — deep dive (grouped, predictable) */}
          <section className="mt-12">
            <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              Подробно
            </p>
            <div className="mt-4 space-y-8">
              {trendCandidates.length > 0 ? (
                <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
                  <p className="mb-2 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
                    Тренд по ястие
                  </p>
                  <h2 className="m-0 mb-5 font-[var(--f-display)] text-2xl font-normal text-[var(--ink)]">
                    Как се движи едно ястие
                  </h2>
                  <DishTrendChart candidates={trendCandidates} />
                </section>
              ) : null}

              {data.dishRanking.length > 0 ? (
                <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
                  <DishRankingTable rows={data.dishRanking} minSample={3} />
                </section>
              ) : null}

              {trendCandidates.length === 0 && data.dishRanking.length === 0 ? (
                <p className="m-0 text-[14px] leading-[1.6] text-[var(--ink-mute)]">
                  Няма достатъчно данни за подробен преглед. Ще се появи, когато
                  ястията съберат повече оценки.
                </p>
              ) : null}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
