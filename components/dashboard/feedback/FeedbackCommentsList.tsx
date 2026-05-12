import type { FeedbackCommentSummary } from "@/lib/feedback/dashboard";

type FeedbackCommentsListProps = {
  comments: FeedbackCommentSummary[];
};

const dateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Sofia",
});

function commentMeta(comment: FeedbackCommentSummary) {
  if (comment.type === "overall") {
    if (comment.overallRating === "like") return "Общ коментар · Харесва ми";
    if (comment.overallRating === "dislike") {
      return "Общ коментар · Не ми харесва";
    }

    return "Общ коментар";
  }

  return `${comment.itemName} · ${comment.rating}/5`;
}

export function FeedbackCommentsList({ comments }: FeedbackCommentsListProps) {
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-tight text-[var(--ink)]">
        Последни коментари
      </h2>

      {comments.length === 0 ? (
        <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          Още няма написани коментари. Оценките пак се броят и се виждат в
          списъците с ястия.
        </p>
      ) : (
        <div className="mt-4 grid gap-3">
          {comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-lg border border-[var(--rule)] bg-[var(--bg)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                  {commentMeta(comment)}
                </span>
                <span className="text-[12px] text-[var(--ink-mute)]">
                  {dateFormatter.format(new Date(comment.completedAt))}
                </span>
              </div>
              <p className="mb-0 mt-3 text-[14px] leading-[1.55] text-[var(--ink)]">
                {comment.text}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
