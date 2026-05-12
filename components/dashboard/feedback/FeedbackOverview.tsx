import { FeedbackCommentsList } from "@/components/dashboard/feedback/FeedbackCommentsList";
import { FeedbackDishList } from "@/components/dashboard/feedback/FeedbackDishList";
import { FeedbackRecentSessions } from "@/components/dashboard/feedback/FeedbackRecentSessions";
import { FeedbackSummaryCards } from "@/components/dashboard/feedback/FeedbackSummaryCards";
import type { FeedbackDashboardData } from "@/lib/feedback/dashboard";

type FeedbackOverviewProps = {
  data: FeedbackDashboardData;
};

export function FeedbackOverview({ data }: FeedbackOverviewProps) {
  const hasFeedback = data.totals.completedSessions > 0;

  return (
    <div className="w-full px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <section className="max-w-[820px]">
        <p className="mb-3 mt-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          Отзиви от клиенти
        </p>
        <h1 className="m-0 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] text-[var(--ink)] max-md:text-[34px]">
          Какво харесват в {data.restaurant.name}
        </h1>
        <p className="m-0 mt-4 text-[16px] leading-[1.6] text-[var(--ink-2)]">
          Обобщение на завършените отзиви, оценките по ястия и последните
          коментари. Без графики засега — само най-важното за прочитане.
        </p>
      </section>

      {!hasFeedback ? (
        <section className="mt-8 rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
          <h2 className="m-0 font-[var(--f-display)] text-[28px] font-normal text-[var(--ink)]">
            Още чакаме първия отзив
          </h2>
          <p className="mb-0 mt-3 max-w-[560px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
            Когато клиент завърши оценяване от таблета, тук ще се появят общите
            резултати, ястията с най-високи и най-ниски оценки и коментарите.
          </p>
        </section>
      ) : null}

      <div className="mt-8">
        <FeedbackSummaryCards totals={data.totals} />
      </div>

      <div className="mt-5 grid grid-cols-[1.1fr_0.9fr] gap-5 max-[1050px]:grid-cols-1">
        <FeedbackRecentSessions sessions={data.recentSessions} />
        <FeedbackCommentsList comments={data.latestComments} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-5 max-[900px]:grid-cols-1">
        <FeedbackDishList
          title="Топ 5 най-харесвани ястия"
          emptyText="Още няма оценки по ястия."
          dishes={data.topRatedDishes}
          compact
        />
        <FeedbackDishList
          title="5 ястия с най-ниска оценка"
          emptyText="Още няма достатъчно оценки по ястия."
          dishes={data.bottomRatedDishes}
          compact
        />
      </div>

      <div className="mt-5">
        <FeedbackDishList
          title="Средна оценка по ястие"
          emptyText="Още няма оценки по конкретни ястия."
          dishes={data.menuItemAverages}
        />
      </div>
    </div>
  );
}
