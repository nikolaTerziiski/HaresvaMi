import { DishTrendChart } from "@/components/dashboard/insights/DishTrendChart";
import { InsightHighlights } from "@/components/dashboard/insights/InsightHighlights";
import { InsightsEmptyState } from "@/components/dashboard/insights/InsightsEmptyState";
import { InsightsSummary } from "@/components/dashboard/insights/InsightsSummary";
import { PeriodSwitcher } from "@/components/dashboard/insights/PeriodSwitcher";
import type {
  DishCandidate,
  InsightsDashboardData,
} from "@/lib/insights/dashboard";
import type { InsightPeriodKey } from "@/lib/insights/types";

type InsightsOverviewProps = {
  data: InsightsDashboardData;
  trendCandidates: DishCandidate[];
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
  custom: "Прозрения за избрания период",
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
}: InsightsOverviewProps) {
  const emptyState = emptyStateFor(data);
  const { period } = data;
  const currentRange = formatDateRange(period.currentFrom, period.currentTo);

  return (
    <div className="w-full px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <section className="max-w-[760px]">
        <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          Прозрения
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

      {emptyState ? (
        <InsightsEmptyState kind={emptyState} />
      ) : (
        <>
          {!data.hasPreviousComparison ? (
            <section className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <p className="m-0 text-[15px] leading-[1.6] text-[var(--ink-2)]">
                {comparisonHint(period.key)}
              </p>
            </section>
          ) : null}

          <div className="mt-8">
            <InsightsSummary data={data} />
          </div>

          <div className="mt-5">
            <InsightHighlights data={data} />
          </div>

          {trendCandidates.length > 0 ? (
            <section className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
              <p className="mb-2 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
                Тренд по ястие
              </p>
              <h2 className="m-0 mb-5 font-[var(--f-display)] text-2xl font-normal text-[var(--ink)]">
                Как се движи едно ястие
              </h2>
              <DishTrendChart candidates={trendCandidates} />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
