import type { FeedbackDashboardData } from "@/lib/feedback/dashboard";

type FeedbackSummaryCardsProps = {
  totals: FeedbackDashboardData["totals"];
};

export function FeedbackSummaryCards({ totals }: FeedbackSummaryCardsProps) {
  const cards = [
    {
      label: "Завършени отзиви",
      value: totals.completedSessions,
      helper: "Всички приключени клиентски сесии.",
    },
    {
      label: "Харесва ми",
      value: totals.overallLike,
      helper: "Клиенти с положителна обща оценка.",
    },
    {
      label: "Не ми харесва",
      value: totals.overallDislike,
      helper: "Клиенти с отрицателна обща оценка.",
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-5 py-4"
        >
          <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            {card.label}
          </p>
          <div className="mt-3 font-[var(--f-display)] text-[42px] leading-none text-[var(--ink)]">
            {card.value}
          </div>
          <p className="mt-3 mb-0 text-[13px] leading-[1.5] text-[var(--ink-2)]">
            {card.helper}
          </p>
        </article>
      ))}
    </section>
  );
}
