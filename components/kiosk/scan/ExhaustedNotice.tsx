import type { KioskScanCopy } from "@/lib/kiosk/types";

export function ExhaustedNotice({ copy }: { copy: KioskScanCopy }) {
  return (
    <div className="mb-6 max-w-[680px] rounded-lg border border-[var(--accent)] bg-[var(--paper)] p-5">
      <h2 className="m-0 font-[var(--f-display)] text-[36px] font-normal leading-tight text-[var(--ink)]">
        {copy.exhaustedTitle}
      </h2>
      <p className="mt-3 mb-2 text-[17px] leading-[1.55] text-[var(--ink-2)]">
        {copy.exhaustedBody}
      </p>
      <p className="m-0 text-[14px] leading-[1.5] text-[var(--ink-mute)]">
        {copy.ownerUpgradeHint}
      </p>
    </div>
  );
}
