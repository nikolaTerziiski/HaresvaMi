import { DASHBOARD_PAGE_FRAME_CLASS } from "@/components/dashboard/shell/page-frame";
import type { FeedbackDashboardData } from "@/lib/feedback/dashboard-types";

import { FeedbackCommentsList } from "./FeedbackCommentsList";
import { FeedbackDishList } from "./FeedbackDishList";
import { FeedbackEmptyState } from "./FeedbackEmptyState";
import { FeedbackSummaryCards } from "./FeedbackSummaryCards";

type FeedbackOverviewProps = {
  data: FeedbackDashboardData;
};

export function FeedbackOverview({ data }: FeedbackOverviewProps) {
  const hasFeedback = data.totals.completedSessions > 0;

  return (
    <div className={DASHBOARD_PAGE_FRAME_CLASS}>
      {!hasFeedback ? (
        <FeedbackEmptyState restaurantName={data.restaurant.name} />
      ) : (
        <>
          {/* Intro */}
          <section className="max-w-[720px]">
            <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
              Отзиви от клиенти
            </p>
            <h2 className="mb-3 mt-2 font-[var(--f-display)] text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
              Какво харесват в{" "}
              <em className="italic text-[var(--accent)]">
                {data.restaurant.name}
              </em>
              .
            </h2>
            <p className="m-0 text-[15px] leading-[1.55] text-[var(--ink-mute)]">
              {data.totals.completedSessions} завършени отзива. Ето какво
              харесват най-много гостите ти и кое има нужда от внимание.
            </p>
          </section>

          {/* Summary cards */}
          <div className="mt-8">
            <FeedbackSummaryCards totals={data.totals} />
          </div>

          {/* 2-col panel grid */}
          <div className="mt-[18px] grid grid-cols-2 gap-[18px] max-[900px]:grid-cols-1">
            <FeedbackDishList
              variant="rank"
              tone="good"
              title="Топ 5 най-харесвани"
              headerChip="ср. оценка"
              dishes={data.topRatedDishes}
              emptyText="Още няма оценки по ястия."
            />
            <FeedbackDishList
              variant="rank"
              tone="bad"
              title="5 с най-ниска оценка"
              headerChip="ср. оценка"
              dishes={data.bottomRatedDishes}
              emptyText="Още няма достатъчно оценки по ястия."
            />
            <FeedbackCommentsList comments={data.latestComments} />
            <FeedbackDishList
              variant="average"
              title="Средна оценка по ястие"
              dishes={data.menuItemAverages}
              emptyText="Още няма оценки по конкретни ястия."
            />
          </div>
        </>
      )}
    </div>
  );
}
