import type { KioskScanCopy } from "@/lib/kiosk/types";

type ThanksPanelProps = {
  copy: KioskScanCopy;
  onReset: () => void;
};

export function ThanksPanel({ copy, onReset }: ThanksPanelProps) {
  return (
    <div className="max-w-[620px]">
      <h2 className="m-0 font-[var(--f-display)] text-[68px] font-normal leading-none">
        {copy.thanksTitle}
      </h2>
      <p className="mt-5 mb-7 text-[22px] leading-[1.55] text-[var(--ink-2)]">
        {copy.thanksBody}
      </p>
      <button
        type="button"
        className="min-h-16 min-w-[260px] rounded-[24px] bg-[var(--ink)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)]"
        onClick={onReset}
      >
        {copy.reset}
      </button>
    </div>
  );
}
