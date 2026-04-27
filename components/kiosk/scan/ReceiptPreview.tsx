import type { KioskRestaurant } from "@/lib/kiosk/types";

type ReceiptPreviewProps = {
  restaurant: KioskRestaurant;
  subtitle: string;
};

export function ReceiptPreview({ restaurant, subtitle }: ReceiptPreviewProps) {
  return (
    <aside className="rounded-[24px] border border-[var(--rule)] bg-[var(--paper)] p-6">
      <div className="mx-auto max-w-[360px] rounded-[18px] border border-[var(--rule)] bg-[var(--bg)] p-5">
        <div className="mb-4 h-[220px] rounded-[14px] border border-dashed border-[var(--ink-mute)] bg-[linear-gradient(180deg,#FDF9F1,#EDE4D3)] p-5">
          <div className="mx-auto h-full max-w-[190px] rounded-[10px] bg-white px-4 py-5 text-[12px] text-[var(--ink-2)] shadow-[0_10px_30px_rgba(26,21,18,0.08)]">
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
