import { ItemList } from "@/components/kiosk/scan/ItemList";
import type { KioskScanCopy, SelectedItem } from "@/lib/kiosk/types";

type ReviewPanelProps = {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onManual: () => void;
  onUseExtracted: () => void;
};

export function ReviewPanel({
  copy,
  items,
  onManual,
  onUseExtracted,
}: ReviewPanelProps) {
  return (
    <div className="max-w-[620px]">
      <h2 className="m-0 font-[var(--f-display)] text-[56px] font-normal leading-none">
        {copy.extractedTitle}
      </h2>
      <p className="mt-4 mb-5 text-[18px] leading-[1.55] text-[var(--ink-2)]">
        {copy.extractedBody}
      </p>
      <ItemList items={items} />
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          className="min-h-16 min-w-[230px] rounded-[24px] bg-[var(--accent)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)]"
          onClick={onUseExtracted}
        >
          {copy.useExtracted}
        </button>
        <button
          type="button"
          className="min-h-16 min-w-[230px] rounded-[24px] border border-[var(--ink)] px-8 py-5 text-[22px] font-semibold text-[var(--ink)]"
          onClick={onManual}
        >
          {copy.useManual}
        </button>
      </div>
    </div>
  );
}
