"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";

type KioskRestaurant = {
  id: string;
  name: string;
};

type KioskMenuItem = {
  id: string;
  name: string;
  category: string | null;
  price: number | null;
};

type ReceiptItem = {
  raw_text: string;
  menu_item_id: string | null;
  menu_item_name: string | null;
  quantity: number;
};

type SelectedItem = {
  id: string;
  name: string;
  quantity: number;
};

type EntitlementResult = {
  allowed: boolean;
  reason: string;
  limit: number;
  used: number;
  remaining: number;
  upgradeTarget: string | null;
};

type KioskScanCopy = {
  scanEyebrow: string;
  title: string;
  subtitle: string;
  remainingScansLabel: string;
  scanButton: string;
  scanAgain: string;
  processing: string;
  exhaustedTitle: string;
  exhaustedBody: string;
  manualButton: string;
  manualTitle: string;
  manualBody: string;
  manualSearch: string;
  noMenuTitle: string;
  noMenuBody: string;
  selectedCountLabel: string;
  continueWithSelection: string;
  chooseAtLeastOne: string;
  extractedTitle: string;
  extractedBody: string;
  useExtracted: string;
  useManual: string;
  scanFailed: string;
  readyTitle: string;
  readyBody: string;
  editSelection: string;
  startCustomerStep: string;
  customerTitle: string;
  customerBody: string;
  finish: string;
  thanksTitle: string;
  thanksBody: string;
  reset: string;
  ownerUpgradeHint: string;
};

type KioskScanScreenProps = {
  restaurant: KioskRestaurant;
  menuItems: KioskMenuItem[];
  initialEntitlement: EntitlementResult;
  copy: KioskScanCopy;
};

type ScreenMode = "scan" | "manual" | "review" | "ready" | "customer" | "thanks";

function formatPrice(price: number | null) {
  if (price === null) return null;

  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "BGN",
  }).format(price);
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("bg-BG");
}

function mapReceiptItems(
  receiptItems: ReceiptItem[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  const menuById = new Map(menuItems.map((item) => [item.id, item]));

  return receiptItems.map((item, index) => {
    const menuItem = item.menu_item_id ? menuById.get(item.menu_item_id) : null;

    return {
      id: item.menu_item_id ?? `receipt-${index}`,
      name: menuItem?.name ?? item.menu_item_name ?? item.raw_text,
      quantity: item.quantity > 0 ? item.quantity : 1,
    };
  });
}

export function KioskScanScreen({
  restaurant,
  menuItems,
  initialEntitlement,
  copy,
}: KioskScanScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entitlement, setEntitlement] = useState(initialEntitlement);
  const [mode, setMode] = useState<ScreenMode>(
    initialEntitlement.remaining > 0 ? "scan" : "manual",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [extractedItems, setExtractedItems] = useState<SelectedItem[]>([]);
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canScan = entitlement.remaining > 0 && menuItems.length > 0;

  const filteredMenuItems = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    if (!normalizedQuery) return menuItems;

    return menuItems.filter((item) =>
      normalizeText(`${item.name} ${item.category ?? ""}`).includes(
        normalizedQuery,
      ),
    );
  }, [menuItems, query]);

  const manualSelectedItems = useMemo(
    () =>
      menuItems
        .filter((item) => selectedIds.has(item.id))
        .map((item) => ({
          id: item.id,
          name: item.name,
          quantity: 1,
        })),
    [menuItems, selectedIds],
  );

  function openCamera() {
    if (!canScan || isProcessing) {
      setMode("manual");
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(copy.processing);

    try {
      const formData = new FormData();
      formData.append("restaurant_id", restaurant.id);
      formData.append("file", file);

      const response = await fetch("/api/extract-receipt", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 402) {
        setEntitlement({
          allowed: false,
          reason: payload.reason ?? "scan_limit_reached",
          used: payload.used ?? entitlement.used,
          limit: payload.limit ?? entitlement.limit,
          remaining: payload.remaining ?? 0,
          upgradeTarget: payload.upgradeTarget ?? entitlement.upgradeTarget,
        });
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      if (!response.ok || !Array.isArray(payload.items)) {
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      const nextExtractedItems = mapReceiptItems(payload.items, menuItems);

      if (payload.usage) {
        setEntitlement((current) => ({
          ...current,
          used: payload.usage.used ?? current.used,
          limit: payload.usage.limit ?? current.limit,
          remaining: payload.usage.remaining ?? current.remaining,
        }));
      }

      if (nextExtractedItems.length === 0) {
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      setExtractedItems(nextExtractedItems);
      setStatusMessage(null);
      setMode("review");
    } catch {
      setStatusMessage(copy.scanFailed);
      setMode("manual");
    } finally {
      setIsProcessing(false);
    }
  }

  function toggleMenuItem(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  }

  function continueWithManualSelection() {
    if (manualSelectedItems.length === 0) {
      setStatusMessage(copy.chooseAtLeastOne);
      return;
    }

    setSelectedItems(manualSelectedItems);
    setStatusMessage(null);
    setMode("ready");
  }

  function continueWithExtractedItems() {
    setSelectedItems(extractedItems);
    setSelectedIds(new Set());
    setStatusMessage(null);
    setMode("ready");
  }

  function resetFlow() {
    setSelectedIds(new Set());
    setSelectedItems([]);
    setExtractedItems([]);
    setQuery("");
    setStatusMessage(null);
    setMode(entitlement.remaining > 0 ? "scan" : "manual");
  }

  return (
    <div className="flex min-h-dvh flex-col px-8 py-7 text-[var(--ink)] max-md:px-5">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.12em] text-[var(--accent)]">
            {copy.scanEyebrow}
          </p>
          <h1 className="mt-2 mb-0 font-[var(--f-display)] text-[48px] font-normal leading-none max-md:text-[36px]">
            {restaurant.name}
          </h1>
        </div>
        <div
          className={[
            "rounded-full border px-4 py-2 text-right font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em]",
            entitlement.remaining > 0
              ? "border-[var(--rule)] text-[var(--ink-mute)]"
              : "border-[var(--accent)] text-[var(--accent)]",
          ].join(" ")}
        >
          {entitlement.remaining > 0
            ? `${entitlement.remaining} / ${entitlement.limit} ${copy.remainingScansLabel}`
            : copy.exhaustedTitle}
        </div>
      </header>

      <section className="grid flex-1 grid-cols-[1.05fr_0.95fr] items-center gap-8 py-10 max-[900px]:grid-cols-1">
        <div>
          {mode === "scan" ? (
            <ScanPanel
              canScan={canScan}
              copy={copy}
              isProcessing={isProcessing}
              remainingText={`${entitlement.remaining} / ${entitlement.limit} ${copy.remainingScansLabel}`}
              onManual={() => setMode("manual")}
              onScan={openCamera}
            />
          ) : null}

          {mode === "manual" ? (
            <>
              {entitlement.remaining <= 0 ? (
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
              ) : null}
              <ManualPanel
                copy={copy}
                filteredMenuItems={filteredMenuItems}
                menuItems={menuItems}
                query={query}
                selectedCount={manualSelectedItems.length}
                selectedIds={selectedIds}
                setQuery={setQuery}
                toggleMenuItem={toggleMenuItem}
                onContinue={continueWithManualSelection}
              />
            </>
          ) : null}

          {mode === "review" ? (
            <ReviewPanel
              copy={copy}
              items={extractedItems}
              onManual={() => setMode("manual")}
              onUseExtracted={continueWithExtractedItems}
            />
          ) : null}

          {mode === "ready" ? (
            <ReadyPanel
              copy={copy}
              items={selectedItems}
              onEdit={() => setMode("manual")}
              onStartCustomerStep={() => setMode("customer")}
            />
          ) : null}

          {mode === "customer" ? (
            <CustomerPanel
              copy={copy}
              items={selectedItems}
              onFinish={() => setMode("thanks")}
            />
          ) : null}

          {mode === "thanks" ? (
            <ThanksPanel copy={copy} onReset={resetFlow} />
          ) : null}

          {statusMessage ? (
            <p
              className="mt-5 max-w-[560px] rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-4 py-3 text-[15px] text-[var(--ink-2)]"
              aria-live="polite"
            >
              {statusMessage}
            </p>
          ) : null}
        </div>

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
              {entitlement.remaining > 0
              ? copy.subtitle
                : copy.ownerUpgradeHint}
            </p>
          </div>
        </aside>
      </section>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

function ScanPanel({
  canScan,
  copy,
  isProcessing,
  remainingText,
  onManual,
  onScan,
}: {
  canScan: boolean;
  copy: KioskScanCopy;
  isProcessing: boolean;
  remainingText: string;
  onManual: () => void;
  onScan: () => void;
}) {
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

function ManualPanel({
  copy,
  filteredMenuItems,
  menuItems,
  query,
  selectedCount,
  selectedIds,
  setQuery,
  toggleMenuItem,
  onContinue,
}: {
  copy: KioskScanCopy;
  filteredMenuItems: KioskMenuItem[];
  menuItems: KioskMenuItem[];
  query: string;
  selectedCount: number;
  selectedIds: Set<string>;
  setQuery: (value: string) => void;
  toggleMenuItem: (itemId: string) => void;
  onContinue: () => void;
}) {
  if (menuItems.length === 0) {
    return (
      <div className="max-w-[620px]">
        <h2 className="m-0 font-[var(--f-display)] text-[56px] font-normal leading-none">
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
            const price = formatPrice(item.price);

            return (
              <button
                key={item.id}
                type="button"
                className={[
                  "min-h-16 rounded-lg border px-4 py-3 text-left transition",
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]"
                    : "border-[var(--rule)] bg-[var(--bg)] text-[var(--ink)] hover:border-[var(--accent)]",
                ].join(" ")}
                onClick={() => toggleMenuItem(item.id)}
              >
                <span className="block text-[18px] font-semibold leading-tight">
                  {item.name}
                </span>
                <span className="mt-1 block text-[13px] opacity-80">
                  {[item.category, price].filter(Boolean).join(" · ")}
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

function ReviewPanel({
  copy,
  items,
  onManual,
  onUseExtracted,
}: {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onManual: () => void;
  onUseExtracted: () => void;
}) {
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

function ReadyPanel({
  copy,
  items,
  onEdit,
  onStartCustomerStep,
}: {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onEdit: () => void;
  onStartCustomerStep: () => void;
}) {
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

function CustomerPanel({
  copy,
  items,
  onFinish,
}: {
  copy: KioskScanCopy;
  items: SelectedItem[];
  onFinish: () => void;
}) {
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

function ThanksPanel({
  copy,
  onReset,
}: {
  copy: KioskScanCopy;
  onReset: () => void;
}) {
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

function ItemList({ items }: { items: SelectedItem[] }) {
  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-3">
      <div className="grid gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex min-h-14 items-center justify-between rounded-md bg-[var(--bg)] px-4 py-3 text-[18px]"
          >
            <span>{item.name}</span>
            <span className="font-[var(--f-mono)] text-[13px] text-[var(--ink-mute)]">
              x{item.quantity}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
