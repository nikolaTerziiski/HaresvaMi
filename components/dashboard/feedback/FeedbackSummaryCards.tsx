import type { FeedbackDashboardData } from "@/lib/feedback/dashboard-types";

type FeedbackSummaryCardsProps = {
  totals: FeedbackDashboardData["totals"];
};

export function FeedbackSummaryCards({ totals }: FeedbackSummaryCardsProps) {
  const { completedSessions, overallLike, overallDislike } = totals;
  const totalVotes = overallLike + overallDislike;
  const likePct =
    totalVotes > 0 ? Math.round((overallLike / totalVotes) * 100) : null;
  const dislikePct =
    totalVotes > 0 ? Math.round((overallDislike / totalVotes) * 100) : null;

  return (
    <div className="grid grid-cols-3 gap-[18px] max-[900px]:grid-cols-1">
      {/* Card 1 – Completed sessions */}
      <article className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
        <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          Завършени отзиви
        </p>
        <div className="mt-3 font-[var(--f-display)] text-[46px] leading-none text-[var(--ink)]">
          {completedSessions}
        </div>
        <p className="mb-0 mt-3 text-[13px] text-[var(--ink-mute)]">
          Всички приключени клиентски сесии.
        </p>
      </article>

      {/* Card 2 – Likes */}
      <article className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
        <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          Харесва ми
        </p>
        <div className="mt-3 font-[var(--f-display)] text-[46px] leading-none text-[var(--good)]">
          {likePct !== null ? (
            <>
              {likePct}
              <small className="text-[18px] italic text-[var(--ink-mute)]">
                %
              </small>
            </>
          ) : (
            "—"
          )}
        </div>
        <p className="mb-0 mt-3 text-[13px] text-[var(--ink-mute)]">
          {overallLike} клиента с положителна оценка
        </p>
      </article>

      {/* Card 3 – Dislikes */}
      <article className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
        <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          Не ми харесва
        </p>
        <div className="mt-3 font-[var(--f-display)] text-[46px] leading-none text-[var(--bad)]">
          {dislikePct !== null ? (
            <>
              {dislikePct}
              <small className="text-[18px] italic text-[var(--ink-mute)]">
                %
              </small>
            </>
          ) : (
            "—"
          )}
        </div>
        <p className="mb-0 mt-3 text-[13px] text-[var(--ink-mute)]">
          {overallDislike} клиента с отрицателна оценка
        </p>
      </article>
    </div>
  );
}
