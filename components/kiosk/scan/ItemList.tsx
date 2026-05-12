import { DishMark } from "@/components/kiosk/scan/DishMark";
import type { SelectedItem } from "@/lib/kiosk/types";

export function ItemList({ items }: { items: SelectedItem[] }) {
  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-3">
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex min-h-16 items-center gap-4 rounded-md bg-[var(--bg)] px-4 py-3 text-[18px]"
          >
            <DishMark imageUrl={item.imageUrl} name={item.name} size="sm" />
            <span className="min-w-0 flex-1 leading-tight">{item.name}</span>
            <span className="font-[var(--f-mono)] text-[13px] text-[var(--ink-mute)]">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
