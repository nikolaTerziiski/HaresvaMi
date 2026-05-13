import type {
  KioskMenuItem,
  KioskScanCopy,
  ReceiptMatch,
  ReceiptReviewDecision,
} from "@/lib/kiosk/types";

type ReviewPanelProps = {
  copy: KioskScanCopy;
  decisions: ReceiptReviewDecision[];
  menuItems: KioskMenuItem[];
  receiptMatches: ReceiptMatch[];
  onIgnoreRow: (rowIndex: number) => void;
  onManual: () => void;
  onMenuItemChange: (rowIndex: number, menuItemId: string | null) => void;
  onUseExtracted: () => void;
};

const matchedViaLabels: Record<ReceiptMatch["matchedVia"], string> = {
  alias: "разпознато",
  fuzzy_match: "провери",
  unknown: "неясно",
};

export function ReviewPanel({
  copy,
  decisions,
  menuItems,
  receiptMatches,
  onIgnoreRow,
  onManual,
  onMenuItemChange,
  onUseExtracted,
}: ReviewPanelProps) {
  const decisionByRow = new Map(
    decisions.map((decision) => [decision.rowIndex, decision]),
  );
  const menuById = new Map(menuItems.map((item) => [item.id, item]));

  return (
    <div className="max-w-[720px]">
      <p className="mb-3 text-[13px] font-semibold tracking-[0.16em] text-[var(--ink-mute)] uppercase">
        За екипа
      </p>
      <h2 className="m-0 font-[var(--f-display)] text-[52px] font-normal leading-none">
        Провери бона
      </h2>
      <p className="mt-4 mb-5 text-[18px] leading-[1.5] text-[var(--ink-2)]">
        Потвърди намерените редове. Верните съвпадения остават така, а грешните
        или неизвестните редове можеш да смениш за секунди.
      </p>

      <div className="max-h-[48vh] overflow-y-auto rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-3">
        <div className="grid gap-3">
          {receiptMatches.map((match, index) => {
            const decision = decisionByRow.get(index);
            const selectedMenuItemId = decision?.menuItemId ?? "";
            const selectedMenuItem = menuById.get(selectedMenuItemId);
            const isUnknown = match.matchedVia === "unknown";
            const isIgnored = decision?.ignored ?? false;
            const displayName =
              selectedMenuItem?.name ?? match.menuItemName ?? "Няма съвпадение";

            return (
              <div
                key={`${match.rawText}-${index}`}
                className="rounded-md bg-[var(--bg)] px-4 py-3"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-[var(--f-mono)] text-[13px] text-[var(--ink-mute)]">
                        x{match.quantity > 0 ? match.quantity : 1}
                      </span>
                      <span className="rounded-full border border-[var(--rule)] px-2.5 py-1 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                        {matchedViaLabels[match.matchedVia]}
                      </span>
                      {isIgnored ? (
                        <span className="rounded-full bg-[var(--paper)] px-2.5 py-1 text-[12px] font-semibold text-[var(--ink-mute)]">
                          Игнориран ред
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 mb-0 text-[18px] leading-tight text-[var(--ink)]">
                      {match.rawText}
                    </p>
                    <p className="mt-1 mb-0 text-[14px] text-[var(--ink-2)]">
                      Съвпадение: {displayName}
                    </p>
                  </div>

                  <div className="w-full max-w-[280px]">
                    <label
                      className="mb-1 block text-[12px] font-semibold text-[var(--ink-mute)] uppercase"
                      htmlFor={`receipt-row-${index}`}
                    >
                      Продукт от менюто
                    </label>
                    <select
                      id={`receipt-row-${index}`}
                      className="min-h-12 w-full rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 text-[16px] text-[var(--ink)]"
                      value={selectedMenuItemId}
                      onChange={(event) =>
                        onMenuItemChange(index, event.target.value || null)
                      }
                    >
                      {isUnknown || !selectedMenuItemId ? (
                        <option value="">Избери продукт</option>
                      ) : null}
                      {selectedMenuItemId && !selectedMenuItem ? (
                        <option value={selectedMenuItemId}>
                          {match.menuItemName ?? "Старо съвпадение"}
                        </option>
                      ) : null}
                      {menuItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    {isUnknown ? (
                      <button
                        type="button"
                        className="mt-2 min-h-10 rounded-md border border-[var(--rule)] px-4 text-[14px] font-semibold text-[var(--ink-2)]"
                        onClick={() => onIgnoreRow(index)}
                      >
                        Игнорирай реда
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
