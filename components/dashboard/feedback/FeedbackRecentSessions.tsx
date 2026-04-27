import type {
  OverallFeedbackRating,
  RecentFeedbackSession,
} from "@/lib/feedback/dashboard";

type FeedbackRecentSessionsProps = {
  sessions: RecentFeedbackSession[];
};

const dateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

function formatRating(value: number | null) {
  return value === null ? "няма" : `${value.toFixed(1).replace(".", ",")}/10`;
}

function overallLabel(value: OverallFeedbackRating | null) {
  if (value === "like") return "Харесва ми";
  if (value === "dislike") return "Не ми харесва";
  return "Без обща оценка";
}

export function FeedbackRecentSessions({
  sessions,
}: FeedbackRecentSessionsProps) {
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-tight text-[var(--ink)]">
        Последни отзиви
      </h2>

      {sessions.length === 0 ? (
        <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          Още няма завършени отзиви. Щом клиент оцени ястие, ще го видиш тук.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {sessions.map((session) => (
            <article
              key={session.id}
              className="rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                  {dateFormatter.format(new Date(session.completedAt))}
                </span>
                <span className="rounded-full border border-[var(--rule)] px-3 py-1 text-[12px] text-[var(--ink-2)]">
                  {overallLabel(session.overallRating)}
                </span>
              </div>

              <div className="mt-3 text-[14px] leading-[1.55] text-[var(--ink-2)]">
                Средна оценка:{" "}
                <strong className="font-semibold text-[var(--ink)]">
                  {formatRating(session.averageItemRating)}
                </strong>{" "}
                · {session.itemRatingCount} оценки на ястия
              </div>

              {session.itemNames.length > 0 ? (
                <p className="mb-0 mt-2 text-[13px] text-[var(--ink-mute)]">
                  {session.itemNames.join(", ")}
                </p>
              ) : null}

              {session.overallComment ? (
                <p className="mb-0 mt-3 border-l-2 border-[var(--accent)] pl-3 text-[14px] leading-[1.55] text-[var(--ink)]">
                  {session.overallComment}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
