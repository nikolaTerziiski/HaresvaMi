import type { FeedbackCommentSummary } from "@/lib/feedback/dashboard-types";

type FeedbackCommentsListProps = {
  comments: FeedbackCommentSummary[];
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("bg-BG", {
    timeZone: "Europe/Sofia",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Sentiment = "pos" | "neg" | "neutral";

function getSentiment(comment: FeedbackCommentSummary): Sentiment {
  if (comment.type === "overall") {
    if (comment.overallRating === "like") return "pos";
    if (comment.overallRating === "dislike") return "neg";
    return "neutral";
  }
  if (comment.rating >= 4) return "pos";
  if (comment.rating <= 2) return "neg";
  return "neutral";
}

function sentimentDotClass(sentiment: Sentiment): string {
  if (sentiment === "pos") return "bg-[var(--good)]";
  if (sentiment === "neg") return "bg-[var(--bad)]";
  return "bg-[var(--ink-mute)]";
}

export function FeedbackCommentsList({ comments }: FeedbackCommentsListProps) {
  return (
    <div className="flex flex-col rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
      {/* Header */}
      <div className="mb-0 flex items-baseline gap-3">
        <h3 className="m-0 font-[var(--f-display)] text-[22px] font-normal leading-tight">
          Последни коментари
        </h3>
        <span className="ml-auto font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
          {comments.length} коментара
        </span>
      </div>

      {comments.length === 0 ? (
        <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          Още няма написани коментари. Оценките пак се броят и се виждат в
          списъците с ястия.
        </p>
      ) : (
        <div className="comments-table mt-4 flex flex-col">
          {/* Column heads */}
          <div className="grid grid-cols-[16px_1fr_60px] gap-3 border-b border-[var(--rule)] pb-2 font-[var(--f-mono)] text-[9.5px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            <span />
            <span>Ястие · коментар</span>
            <span className="text-right">кога</span>
          </div>

          {/* Rows */}
          <ul
            className="m-0 list-none overflow-y-auto p-0"
            style={{ maxHeight: "300px" }}
          >
            {comments.map((comment) => {
              const sentiment = getSentiment(comment);
              const dishLabel =
                comment.type === "item" ? comment.itemName : "Общ коментар";
              const when = formatDate(comment.completedAt);

              return (
                <li
                  key={comment.id}
                  className="grid grid-cols-[16px_1fr_60px] items-baseline gap-3 border-t border-[var(--rule)] py-[11px] first:border-t-0"
                >
                  {/* Sentiment dot */}
                  <span
                    className={`size-2 rounded-full ${sentimentDotClass(sentiment)} mt-[5px]`}
                  />

                  {/* Main content */}
                  <div className="min-w-0">
                    <span className="mb-0.5 block text-[12px] font-medium text-[var(--ink)]">
                      {dishLabel}
                    </span>
                    <p className="m-0 text-[13px] italic leading-[1.45] text-[var(--ink-2)]">
                      „{comment.text}"
                    </p>
                  </div>

                  {/* When */}
                  <span className="text-right font-[var(--f-mono)] text-[10px] whitespace-nowrap text-[var(--ink-mute)]">
                    {when}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
