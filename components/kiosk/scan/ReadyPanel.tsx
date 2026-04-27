import { ItemList } from "@/components/kiosk/scan/ItemList";
import type { KioskScanCopy, SelectedItem } from "@/lib/kiosk/types";

type ReadyPanelProps = {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onEdit: () => void;
  onStartCustomerStep: () => void;
};

export function ReadyPanel({
  copy,
  items,
  onEdit,
  onStartCustomerStep,
}: ReadyPanelProps) {
  return (
    <div className="max-w-[620px]">
      <h2 className="m-0 font-[var(--f-display)] text-[60px] font-normal leading-none">
        {copy.readyTitle}
      </h2>
      <p className="mt-4 mb-5 text-[20px] leading-[1.55] text-[var(--ink-2)]">
        {copy.readyBody}
      </p>
      <ItemList items={items} />
      <div className="mt-6 flex flex-wrap gap-4">
        <button
          type="button"
          className="min-h-16 min-w-[260px] rounded-[24px] bg-[var(--accent)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)]"
          onClick={onStartCustomerStep}
        >
          {copy.startCustomerStep}
        </button>
        <button
          type="button"
          className="min-h-16 min-w-[220px] rounded-[24px] border border-[var(--ink)] px-8 py-5 text-[22px] font-semibold text-[var(--ink)]"
          onClick={onEdit}
        >
          {copy.editSelection}
        </button>
      </div>
    </div>
  );
}
