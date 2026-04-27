import type { KioskScanCopy, SelectedItem } from "@/lib/kiosk/types";

type CustomerPanelProps = {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onFinish: () => void;
};

export function CustomerPanel({ copy, items, onFinish }: CustomerPanelProps) {
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
                (score) => (
                  <button
                    key={score}
                    type="button"
                    className="min-h-12 rounded-lg border border-[var(--rule)] bg-[var(--bg)] text-[18px] font-semibold text-[var(--ink)] focus:border-[var(--accent)] focus:bg-[var(--accent)] focus:text-[var(--paper)]"
                  >
                    {score}
                  </button>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 min-h-16 min-w-[260px] rounded-[24px] bg-[var(--accent)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)]"
        onClick={onFinish}
      >
        {copy.finish}
      </button>
    </div>
  );
}
