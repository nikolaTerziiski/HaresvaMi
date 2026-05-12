import { Heart, LockKeyhole, ThumbsDown } from "lucide-react";

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
    <div className="flex min-h-[calc(100dvh-56px)] flex-col">
      <header className="flex items-end justify-between gap-6 px-8 pt-5 pb-4 max-md:flex-col max-md:items-start max-md:px-5">
        <div>
          <h2 className="m-0 font-[var(--f-display)] text-[44px] font-normal leading-none text-[var(--ink)] max-md:text-[36px]">
            {copy.customerTitle}
          </h2>
          <p className="mt-2 mb-0 max-w-[760px] text-[16px] leading-[1.4] text-[var(--ink-2)]">
            {copy.customerBody}
          </p>
        </div>
        <p className="m-0 shrink-0 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <b className="text-[var(--ink)]">{ratedCount}</b>{" "}
          {copy.customerProgress} {items.length} {copy.customerProgressSuffix}
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-auto px-8 pb-4 max-md:px-5">
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

        <section className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-4 py-3">
          <h3 className="m-0 flex-1 text-[16px] font-medium text-[var(--ink-2)]">
            {copy.overallTitle}
          </h3>
          <div className="flex flex-wrap gap-3">
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
          </div>
        </section>
      </div>

      <footer className="flex items-center gap-4 border-t border-[var(--rule)] bg-[var(--paper)] px-8 py-3 max-md:flex-col max-md:items-stretch max-md:px-5">
        <div className="flex-1">
          <p className="m-0 flex items-center gap-2 text-[13px] leading-[1.4] text-[var(--ink-mute)]">
            <LockKeyhole aria-hidden="true" size={16} strokeWidth={1.5} />
            {copy.anonymousNote}
          </p>
          {statusMessage ? (
            <p className="mt-2 mb-0 text-[14px] text-[var(--accent)]">
              {statusMessage}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="min-h-14 min-w-[230px] rounded-[20px] bg-[var(--accent)] px-7 py-4 text-[20px] font-semibold text-[var(--paper)] transition disabled:cursor-not-allowed disabled:bg-[var(--rule)] disabled:text-[var(--ink-mute)]"
          disabled={isSaving || !hasFeedback}
          onClick={onFinish}
        >
          {isSaving
            ? copy.savingFeedback
            : hasFeedback
              ? copy.finish
              : copy.finishDisabled}
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
        "inline-flex min-h-11 min-w-[160px] items-center justify-center gap-2 rounded-full border px-5 py-2 text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
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
