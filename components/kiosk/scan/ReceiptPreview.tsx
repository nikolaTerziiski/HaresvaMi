import type { KioskRestaurant } from "@/lib/kiosk/types";

type ReceiptPreviewProps = {
  restaurant: KioskRestaurant;
  subtitle: string;
};

export function ReceiptPreview({ restaurant, subtitle }: ReceiptPreviewProps) {
  return (
    <aside className="rounded-2xl border border-[var(--rule)] bg-[var(--paper)] p-6">
      <div className="mx-auto max-w-[360px] rounded-2xl border border-[var(--rule)] bg-[var(--bg)] p-5">
        <div className="relative mb-4 h-[260px] overflow-hidden rounded-xl border border-dashed border-[var(--ink-mute)] bg-[var(--paper)] p-5">
          <div className="absolute inset-x-8 top-20 h-0.5 bg-[var(--accent)]" />
          <div className="mx-auto h-full max-w-[190px] rotate-[-2deg] rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-4 py-5 font-[var(--f-mono)] text-[11px] text-[var(--ink-2)]">
            <div className="mb-4 text-center font-semibold">
              {restaurant.name}
            </div>
            <div className="flex justify-between border-b border-dashed border-[var(--rule)] py-1">
              <span>Шопска</span>
              <span>8,90</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-[var(--rule)] py-1">
              <span>Кебапче x2</span>
              <span>7,80</span>
            </div>
            <div className="flex justify-between border-b border-dashed border-[var(--rule)] py-1">
              <span>Таратор</span>
              <span>4,50</span>
            </div>
            <div className="mt-4 flex justify-between font-semibold">
              <span>СУМА</span>
              <span>21,20</span>
            </div>
          </div>
        </div>
        <p className="m-0 text-[16px] leading-[1.5] text-[var(--ink-2)]">
          {subtitle}
        </p>
      </div>
    </aside>
  );
}
