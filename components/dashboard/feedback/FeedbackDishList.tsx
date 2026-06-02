import type { MenuItemRatingSummary } from "@/lib/feedback/dashboard-types";

type FeedbackDishListProps = {
  title: string;
  headerChip?: string;
  emptyText: string;
  dishes: MenuItemRatingSummary[];
  variant: "rank" | "average";
  tone?: "good" | "bad";
};

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

export function FeedbackDishList({
  title,
  headerChip,
  emptyText,
  dishes,
  variant,
  tone = "good",
}: FeedbackDishListProps) {
  const chip =
    headerChip ??
    (variant === "average" ? `${dishes.length} ястия` : "ср. оценка");

  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
      {/* Header */}
      <div className="mb-4 flex items-baseline gap-3">
        <h3 className="m-0 font-[var(--f-display)] text-[22px] font-normal leading-tight">
          {title}
        </h3>
        <span className="ml-auto font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
          {chip}
        </span>
      </div>

      {dishes.length === 0 ? (
        <p className="mb-0 text-[14px] leading-[1.55] text-[var(--ink-2)]">
          {emptyText}
        </p>
      ) : variant === "rank" ? (
        /* ── Rank variant (≤5 rows, no scroll) ── */
        <ul className="m-0 list-none p-0">
          {dishes.map((dish, index) => {
            const pct = Math.round((dish.averageRating / 5) * 100);
            const barColor = tone === "bad" ? "var(--bad)" : "var(--good)";
            return (
              <li
                key={dish.menuItemId}
                className="flex items-center gap-3.5 border-t border-[var(--rule)] py-[11px] first:border-t-0"
              >
                <span className="w-4 shrink-0 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-[14px] text-[var(--ink)]">
                  {dish.name}
                </span>
                <span
                  className="flex-[0_0_120px] overflow-hidden rounded bg-[var(--bg-2)]"
                  style={{ height: "7px" }}
                >
                  <span
                    className="block h-full rounded"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </span>
                <span className="w-11 text-right font-[var(--f-mono)] text-[12px] text-[var(--ink-2)]">
                  {formatRating(dish.averageRating)}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        /* ── Average variant (2-col scrollable) ── */
        <ul
          className="m-0 grid list-none grid-cols-2 gap-x-10 gap-y-0 overflow-y-auto p-0 max-[900px]:grid-cols-1"
          style={{ maxHeight: "300px" }}
        >
          {dishes.map((dish) => {
            const pct = Math.round((dish.averageRating / 5) * 100);
            return (
              <li
                key={dish.menuItemId}
                className="flex items-center gap-3 border-t border-[var(--rule)] py-[9px] first:border-t-0"
              >
                <span className="flex-1 truncate text-[13.5px] text-[var(--ink-2)]">
                  {dish.name}
                </span>
                <span
                  className="flex-[0_0_90px] overflow-hidden rounded bg-[var(--bg-2)]"
                  style={{ height: "6px" }}
                >
                  <span
                    className="block h-full rounded bg-[linear-gradient(90deg,var(--accent-2),var(--good))]"
                    style={{ width: `${pct}%` }}
                  />
                </span>
                <span className="w-9 text-right font-[var(--f-mono)] text-[11.5px] text-[var(--ink-2)]">
                  {formatRating(dish.averageRating)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
