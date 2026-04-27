import type {
  KioskScanCopy,
  OverallRating,
  SelectedItem,
} from "@/lib/kiosk/types";

type CustomerPanelProps = {
  copy: KioskScanCopy;
  isSaving: boolean;
  items: SelectedItem[];
  itemRatings: Record<string, number>;
  overallRating: OverallRating | null;
  onItemRatingChange: (itemId: string, rating: number) => void;
  onFinish: () => void;
  onOverallRatingChange: (rating: OverallRating) => void;
};

export function CustomerPanel({
  copy,
  isSaving,
  items,
  itemRatings,
  overallRating,
  onItemRatingChange,
  onFinish,
  onOverallRatingChange,
}: CustomerPanelProps) {
  return (
    <div className="max-w-[720px]">
      <h2 className="m-0 font-[var(--f-display)] text-[60px] font-normal leading-none">
        {copy.customerTitle}
      </h2>
      <p className="mt-4 mb-5 text-[20px] leading-[1.55] text-[var(--ink-2)]">
        {copy.customerBody}
      </p>
      <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-4"
          >
            <div className="mb-3 text-[20px] font-semibold">{item.name}</div>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 10 }, (_, index) => index + 1).map(
                (score) => {
                  const selected = itemRatings[item.id] === score;

                  return (
                    <button
                      key={score}
                      type="button"
                      className={[
                        "min-h-12 rounded-lg border text-[18px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
                        selected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
                          : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] focus:border-[var(--accent)] focus:bg-[var(--accent)] focus:text-[var(--paper)]",
                      ].join(" ")}
                      disabled={isSaving}
                      onClick={() => onItemRatingChange(item.id, score)}
                    >
                      {score}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          className={[
            "min-h-14 min-w-[190px] rounded-[22px] border px-6 py-4 text-[20px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            overallRating === "like"
              ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
              : "border-[var(--ink)] text-[var(--ink)]",
          ].join(" ")}
          disabled={isSaving}
          onClick={() => onOverallRatingChange("like")}
        >
          {copy.overallLike}
        </button>
        <button
          type="button"
          className={[
            "min-h-14 min-w-[190px] rounded-[22px] border px-6 py-4 text-[20px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
            overallRating === "dislike"
              ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]"
              : "border-[var(--ink)] text-[var(--ink)]",
          ].join(" ")}
          disabled={isSaving}
          onClick={() => onOverallRatingChange("dislike")}
        >
          {copy.overallDislike}
        </button>
      </div>
      <button
        type="button"
        className="mt-6 min-h-16 min-w-[260px] rounded-[24px] bg-[var(--accent)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)] transition disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSaving}
        onClick={onFinish}
      >
        {isSaving ? copy.savingFeedback : copy.finish}
      </button>
    </div>
  );
}
