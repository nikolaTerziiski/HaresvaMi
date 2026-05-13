import type {
  CommentOfWeek,
  DishInsight,
  InsightsDashboardData,
} from "@/lib/insights/dashboard";

type InsightHighlightsProps = {
  data: InsightsDashboardData;
};

type InsightCardProps = {
  title: string;
  children: React.ReactNode;
};

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function deltaText(delta: number | null) {
  if (delta === null) return "без база за сравнение";

  const arrow = delta > 0 ? "▲" : delta < 0 ? "▼" : "•";
  const sign = delta > 0 ? "+" : "";

  return `${arrow} ${sign}${delta.toFixed(1).replace(".", ",")}`;
}

function DishInsightBody({
  dish,
  empty,
}: {
  dish: DishInsight | null;
  empty: string;
}) {
  if (!dish) {
    return (
      <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
        {empty}
      </p>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="m-0 text-[18px] font-medium leading-snug text-[var(--ink)]">
        {dish.name}
      </h3>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <span className="font-[var(--f-display)] text-[44px] leading-none text-[var(--ink)]">
          {formatRating(dish.currentAverage)}
        </span>
        <span className="pb-2 text-[14px] text-[var(--ink-mute)]">
          /5 от {dish.currentCount} оценки
        </span>
      </div>
      <p className="mb-0 mt-3 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {deltaText(dish.delta)}
      </p>
    </div>
  );
}

function CommentBody({ comment }: { comment: CommentOfWeek | null }) {
  if (!comment) {
    return (
      <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
        Тази седмица още няма написани коментари. Оценките пак се броят.
      </p>
    );
  }

  const meta =
    comment.type === "overall"
      ? comment.overallRating === "like"
        ? "Общ коментар · Харесва ми"
        : comment.overallRating === "dislike"
          ? "Общ коментар · Не ми харесва"
          : "Общ коментар"
      : `${comment.itemName} · ${comment.rating}/5`;

  return (
    <div className="mt-4">
      <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {meta}
      </p>
      <p className="mb-0 mt-3 border-l-2 border-[var(--accent)] pl-4 text-[15px] leading-[1.65] text-[var(--ink)]">
        {comment.text}
      </p>
    </div>
  );
}

function InsightCard({ title, children }: InsightCardProps) {
  return (
    <article className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[27px] font-normal leading-tight text-[var(--ink)]">
        {title}
      </h2>
      {children}
    </article>
  );
}

export function InsightHighlights({ data }: InsightHighlightsProps) {
  return (
    <section className="grid grid-cols-2 gap-5 max-[1050px]:grid-cols-1">
      <InsightCard title="Най-силно ястие">
        <DishInsightBody
          dish={data.topPerformer}
          empty="Няма ястие с поне 3 оценки тази седмица. Няма да обявяваме победител от една случайна оценка."
        />
      </InsightCard>
      <InsightCard title="Ястие за наблюдение">
        <DishInsightBody
          dish={data.watchDish}
          empty="Няма сигурен спад или ниска оценка с достатъчно данни. Една лоша оценка сама по себе си не е тревога."
        />
      </InsightCard>
      <InsightCard title="Подобрение">
        <DishInsightBody
          dish={data.improvedDish}
          empty="Още няма ястие с ясно подобрение спрямо предишните 7 дни."
        />
      </InsightCard>
      <InsightCard title="Коментар на седмицата">
        <CommentBody comment={data.commentOfWeek} />
      </InsightCard>
    </section>
  );
}
