import { Heart, ThumbsDown } from "lucide-react";

import { DishRatingRow } from "@/components/kiosk/scan/DishRatingRow";
import type {
  KioskScanCopy,
  OverallRating,
  SelectedItem,
} from "@/lib/kiosk/types";
import { cn } from "@/lib/utils/cn";

type CustomerPanelProps = {
  copy: KioskScanCopy;
  isSaving: boolean;
  items: SelectedItem[];
  itemRatings: Record<string, number>;
  overallRating: OverallRating | null;
  statusMessage: string | null;
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
  statusMessage,
  onItemRatingChange,
  onFinish,
  onOverallRatingChange,
}: CustomerPanelProps) {
  const ratedCount = Object.keys(itemRatings).length;
  const hasFeedback = ratedCount > 0 || overallRating !== null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="px-7 pt-5 pb-4 max-md:px-5">
        <h2 className="m-0 font-[var(--f-display)] text-[40px] font-normal leading-none text-[var(--ink)] max-md:text-[34px]">
          {copy.customerTitle}
        </h2>
        <p className="mt-2 mb-0 max-w-[760px] text-[16px] leading-[1.4] text-[var(--ink-2)]">
          {copy.customerBody}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-7 pb-3 max-md:px-5">
        <div className="overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--paper)]">
          {items.map((item) => {
            const rating = itemRatings[item.id] ?? 0;

            return (
              <DishRatingRow
                key={item.id}
                disabled={isSaving}
                item={item}
                rating={rating}
                onRatingChange={onItemRatingChange}
              />
            );
          })}
        </div>
      </div>

      <footer className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-[var(--rule)] bg-[var(--paper)] px-7 py-3 max-[980px]:grid-cols-1 max-md:px-5">
        <div className="min-w-0">
          <section className="flex flex-wrap items-center gap-2">
            <OverallButton
              active={overallRating === "like"}
              disabled={isSaving}
              icon="like"
              label={copy.overallLike}
              tone="good"
              onClick={() => onOverallRatingChange("like")}
            />
            <OverallButton
              active={overallRating === "dislike"}
              disabled={isSaving}
              icon="dislike"
              label={copy.overallDislike}
              tone="bad"
              onClick={() => onOverallRatingChange("dislike")}
            />
          </section>
          {statusMessage ? (
            <p className="mt-2 mb-0 text-[14px] text-[var(--accent)]">
              {statusMessage}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="min-h-14 min-w-[220px] rounded-[20px] bg-[var(--accent)] px-7 py-3.5 text-[19px] font-semibold text-[var(--paper)] transition disabled:cursor-not-allowed disabled:bg-[var(--rule)] disabled:text-[var(--ink-mute)] max-[980px]:w-full"
          disabled={isSaving || !hasFeedback}
          onClick={onFinish}
        >
          {isSaving ? copy.savingFeedback : copy.finish}
        </button>
      </footer>
    </div>
  );
}

type OverallButtonProps = {
  active: boolean;
  disabled: boolean;
  icon: "like" | "dislike";
  label: string;
  tone: "good" | "bad";
  onClick: () => void;
};

function OverallButton({
  active,
  disabled,
  icon,
  label,
  tone,
  onClick,
}: OverallButtonProps) {
  const Icon = icon === "like" ? Heart : ThumbsDown;

  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-10 min-w-[138px] items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-[14px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? tone === "good"
            ? "border-[var(--good)] bg-[var(--good)] text-[var(--paper)]"
            : "border-[var(--plum)] bg-[var(--plum)] text-[var(--paper)]"
          : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--ink)]",
      )}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={20} strokeWidth={1.5} />
      {label}
    </button>
  );
}
