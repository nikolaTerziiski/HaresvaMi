import type { MenuItemRatingSummary } from "@/lib/feedback/dashboard";

type FeedbackDishListProps = {
  title: string;
  emptyText: string;
  dishes: MenuItemRatingSummary[];
  compact?: boolean;
};

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

export function FeedbackDishList({
  title,
  emptyText,
  dishes,
  compact = false,
}: FeedbackDishListProps) {
  return (
    <section className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-tight text-[var(--ink)]">
        {title}
      </h2>

      {dishes.length === 0 ? (
        <p className="mb-0 mt-4 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          {emptyText}
        </p>
      ) : (
        <div
          className={
            compact ? "mt-4 grid gap-2" : "mt-4 max-h-[420px] overflow-auto"
          }
        >
          {dishes.map((dish) => (
            <div
              key={dish.menuItemId}
              className="grid min-h-14 grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-[var(--rule)] py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[15px] font-medium text-[var(--ink)]">
                  {dish.name}
                </div>
                <div className="mt-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
                  {dish.ratingCount} оценки
                </div>
              </div>
              <div className="font-[var(--f-display)] text-[28px] leading-none text-[var(--ink)]">
                {formatRating(dish.averageRating)}
              </div>
              <div className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
                /5
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
