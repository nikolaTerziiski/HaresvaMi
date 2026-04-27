import type { KioskScanCopy } from "@/lib/kiosk/types";

type ScanPanelProps = {
  canScan: boolean;
  copy: KioskScanCopy;
  isProcessing: boolean;
  remainingText: string;
  onManual: () => void;
  onScan: () => void;
};

export function ScanPanel({
  canScan,
  copy,
  isProcessing,
  remainingText,
  onManual,
  onScan,
}: ScanPanelProps) {
  return (
    <div className="max-w-[640px]">
      <h2 className="m-0 font-[var(--f-display)] text-[64px] font-normal leading-[0.95] max-md:text-[44px]">
        {copy.title}
      </h2>
      <p className="mt-5 mb-8 max-w-[520px] text-[20px] leading-[1.55] text-[var(--ink-2)]">
        {copy.subtitle}
      </p>
      <p className="mb-4 inline-flex rounded-full border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {remainingText}
      </p>
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          className="min-h-16 min-w-[230px] rounded-[24px] bg-[var(--accent)] px-8 py-5 text-[24px] font-semibold text-[var(--paper)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canScan || isProcessing}
          onClick={onScan}
        >
          {isProcessing ? copy.processing : copy.scanButton}
        </button>
        <button
          type="button"
          className="min-h-16 min-w-[230px] rounded-[24px] border border-[var(--ink)] bg-transparent px-8 py-5 text-[22px] font-semibold text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          onClick={onManual}
        >
          {copy.manualButton}
        </button>
      </div>
    </div>
  );
}
