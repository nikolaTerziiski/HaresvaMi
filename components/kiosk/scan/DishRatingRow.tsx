import { DishMark } from "@/components/kiosk/scan/DishMark";
import { StarRating } from "@/components/kiosk/scan/StarRating";
import type { SelectedItem } from "@/lib/kiosk/types";
import { cn } from "@/lib/utils/cn";

type DishRatingRowProps = {
  disabled: boolean;
  item: SelectedItem;
  rating: number;
  onRatingChange: (itemId: string, rating: number) => void;
};

export function DishRatingRow({
  disabled,
  item,
  rating,
  onRatingChange,
}: DishRatingRowProps) {
  return (
    <section
      className={cn(
        "grid min-h-[72px] grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--rule)] px-4 py-2 last:border-b-0 max-sm:grid-cols-[56px_minmax(0,1fr)] max-sm:gap-y-2",
        rating > 0 && "bg-[var(--paper)]",
      )}
    >
      <DishMark imageUrl={item.imageUrl} name={item.name} size="md" />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="m-0 truncate text-[18px] font-medium leading-tight text-[var(--ink)]">
            {item.name}
          </h3>
          {item.quantity > 1 ? (
            <span className="shrink-0 rounded-full border border-[var(--rule)] bg-[var(--bg)] px-2 py-0.5 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
              x{item.quantity}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-1 mb-0 line-clamp-1 text-[13px] leading-snug text-[var(--ink-mute)]">
            {item.description}
          </p>
        ) : null}
      </div>

      <div className="max-sm:col-span-2 max-sm:justify-self-end">
        <StarRating
          disabled={disabled}
          itemName={item.name}
          value={rating}
          onChange={(score) => onRatingChange(item.id, score)}
        />
      </div>
    </section>
  );
}
