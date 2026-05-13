import { ArrowLeft, Check } from "lucide-react";

import { DishMark } from "@/components/kiosk/scan/DishMark";
import { formatMenuItemMeta } from "@/lib/kiosk/format";
import type { KioskMenuItem, KioskScanCopy } from "@/lib/kiosk/types";
import { cn } from "@/lib/utils/cn";

type ManualPanelProps = {
  copy: KioskScanCopy;
  filteredMenuItems: KioskMenuItem[];
  menuItems: KioskMenuItem[];
  query: string;
  selectedCount: number;
  selectedIds: Set<string>;
  setQuery: (value: string) => void;
  toggleMenuItem: (itemId: string) => void;
  onBack?: () => void;
  onContinue: () => void;
};

function BackButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-5 inline-flex items-center gap-2 rounded-md px-2 py-1 text-[14px] text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
      {label}
    </button>
  );
}

export function ManualPanel({
  copy,
  filteredMenuItems,
  menuItems,
  query,
  selectedCount,
  selectedIds,
  setQuery,
  toggleMenuItem,
  onBack,
  onContinue,
}: ManualPanelProps) {
  if (menuItems.length === 0) {
    return (
      <div className="max-w-[620px]">
        {onBack ? (
          <BackButton label={copy.backToScan} onClick={onBack} />
        ) : null}
        <h2 className="m-0 font-[var(--f-display)] text-[56px] font-normal leading-none max-md:text-[38px]">
          {copy.noMenuTitle}
        </h2>
        <p className="mt-5 text-[20px] leading-[1.55] text-[var(--ink-2)]">
          {copy.noMenuBody}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[760px]">
      {onBack ? <BackButton label={copy.backToScan} onClick={onBack} /> : null}
      <h2 className="m-0 font-[var(--f-display)] text-[54px] font-normal leading-none max-md:text-[38px]">
        {copy.manualTitle}
      </h2>
      <p className="mt-4 mb-6 max-w-[560px] text-[18px] leading-[1.55] text-[var(--ink-2)]">
        {copy.manualBody}
      </p>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.manualSearch}
          className="min-h-14 min-w-[280px] flex-1 rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-4 text-[18px] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
        />
        <span className="rounded-full border border-[var(--rule)] px-4 py-3 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          {selectedCount} {copy.selectedCountLabel}
        </span>
      </div>
      <div className="max-h-[42dvh] overflow-auto rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-3">
        <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
          {filteredMenuItems.map((item) => {
            const selected = selectedIds.has(item.id);

            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex min-h-20 items-center gap-3 rounded-lg border px-3 py-3 text-left transition",
                  selected
                    ? "border-[var(--accent)] bg-[var(--paper)] text-[var(--ink)]"
                    : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)]",
                )}
                onClick={() => toggleMenuItem(item.id)}
              >
                <DishMark imageUrl={item.imageUrl} name={item.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[18px] font-semibold leading-tight">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-[13px] text-[var(--ink-mute)]">
                    {formatMenuItemMeta(item)}
                  </span>
                </span>
                <span
                  className={cn(
                    "grid size-6 shrink-0 place-items-center rounded-full border",
                    selected
                      ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
                      : "border-[var(--rule)] text-transparent",
                  )}
                >
                  <Check aria-hidden="true" size={14} strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        className="mt-5 min-h-16 min-w-[260px] rounded-[24px] bg-[var(--ink)] px-8 py-5 text-[22px] font-semibold text-[var(--paper)] transition hover:opacity-95"
        onClick={onContinue}
      >
        {copy.continueWithSelection}
      </button>
    </div>
  );
}
