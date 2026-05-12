import { ListChecks, ReceiptText } from "lucide-react";

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
    <div className="max-w-[680px]">
      <p className="mb-4 inline-flex rounded-full bg-[var(--ink)] px-3 py-1 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.1em] text-[var(--paper)]">
        {copy.staffBadge}
      </p>
      <h2 className="m-0 font-[var(--f-display)] text-[64px] font-normal leading-[0.95] text-[var(--ink)] max-md:text-[44px]">
        {copy.title}
      </h2>
      <p className="mt-5 mb-8 max-w-[520px] text-[20px] leading-[1.55] text-[var(--ink-2)]">
        {copy.subtitle}
      </p>
      <p className="mb-4 inline-flex rounded-full border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {remainingText}
      </p>
      <div className="grid max-w-[620px] grid-cols-2 gap-3 rounded-2xl bg-[var(--bg-2)] p-2 max-sm:grid-cols-1">
        <button
          type="button"
          className="flex min-h-20 items-center gap-4 rounded-xl bg-[var(--paper)] px-5 py-4 text-left transition hover:bg-[var(--paper)] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!canScan || isProcessing}
          onClick={onScan}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--accent)] text-[var(--paper)]">
            <ReceiptText aria-hidden="true" size={22} strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[20px] font-semibold text-[var(--ink)]">
              {isProcessing ? copy.processing : copy.scanButton}
            </span>
            <span className="mt-1 block text-[13px] text-[var(--ink-mute)]">
              {copy.scanRecommended}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="flex min-h-20 items-center gap-4 rounded-xl px-5 py-4 text-left text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
          onClick={onManual}
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--bg)] text-[var(--accent)]">
            <ListChecks aria-hidden="true" size={22} strokeWidth={1.5} />
          </span>
          <span>
            <span className="block text-[20px] font-semibold">
              {copy.manualButton}
            </span>
            <span className="mt-1 block text-[13px] text-[var(--ink-mute)]">
              {copy.manualFallbackLabel}
            </span>
          </span>
        </button>
      </div>
    </div>
  );
}
