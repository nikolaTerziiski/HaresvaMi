import { InsightHighlights } from "@/components/dashboard/insights/InsightHighlights";
import { InsightsEmptyState } from "@/components/dashboard/insights/InsightsEmptyState";
import { InsightsSummary } from "@/components/dashboard/insights/InsightsSummary";
import type { InsightsDashboardData } from "@/lib/insights/dashboard";

type InsightsOverviewProps = {
  data: InsightsDashboardData;
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

function emptyStateFor(data: InsightsDashboardData) {
  if (data.menuItemCount === 0) return "no-menu";
  if (data.allCompletedSessions === 0) return "no-feedback";
  if (data.current.itemRatingCount < 3) return "not-enough-weekly-data";

  return null;
}

export function InsightsOverview({ data }: InsightsOverviewProps) {
  const emptyState = emptyStateFor(data);
  const currentRange = formatDateRange(
    data.windows.current.start,
    data.windows.current.end,
  );

  return (
    <div className="w-full px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <section className="max-w-[760px]">
        <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          Прозрения
        </p>
        <h1 className="m-0 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
          Какво да видиш тази седмица
        </h1>
        <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--ink-2)]">
          Последните 7 дни в {data.restaurant.name}: {currentRange}. Показваме
          само сигнали с достатъчно оценки, без измислени тенденции.
        </p>
      </section>

      {emptyState ? (
        <InsightsEmptyState kind={emptyState} />
      ) : (
        <>
          {!data.hasPreviousComparison ? (
            <section className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
              <p className="m-0 text-[15px] leading-[1.6] text-[var(--ink-2)]">
                Сравнението с предишна седмица ще започне, когато има отзиви и в
                двата 7-дневни периода. Дотогава показваме само текущата
                седмица.
              </p>
            </section>
          ) : null}

          <div className="mt-8">
            <InsightsSummary data={data} />
          </div>

          <div className="mt-5">
            <InsightHighlights data={data} />
          </div>
        </>
      )}
    </div>
  );
}
