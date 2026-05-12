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
        "grid min-h-16 grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-[var(--rule)] px-3 py-1.5 last:border-b-0 max-sm:grid-cols-[48px_minmax(0,1fr)] max-sm:gap-y-2",
        rating > 0 && "bg-[var(--paper)]",
      )}
    >
      <DishMark imageUrl={item.imageUrl} name={item.name} size="sm" />

      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="m-0 truncate text-[17px] font-medium leading-tight text-[var(--ink)]">
            {item.name}
          </h3>
          {item.quantity > 1 ? (
            <span className="shrink-0 rounded-full border border-[var(--rule)] bg-[var(--bg)] px-2 py-0.5 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
              x{item.quantity}
            </span>
          ) : null}
        </div>
        {item.description ? (
          <p className="mt-0.5 mb-0 line-clamp-1 text-[12px] leading-snug text-[var(--ink-mute)]">
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
