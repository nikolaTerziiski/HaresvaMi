"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, Tag, Trash2 } from "lucide-react";

import { AliasManagerPopover } from "@/components/dashboard/menu/AliasManagerPopover";
import { MenuItemReadRow } from "@/components/dashboard/menu/MenuItemReadRow";
import { parsePrice } from "@/lib/menu/format";
import { bgnToEur, formatEur } from "@/lib/menu/currency";
import type { MenuItemField, MenuItemRow, RowError } from "@/lib/menu/types";

type MenuItemEditorRowProps = {
  item: MenuItemRow;
  rowErrors: RowError;
  categories: string[];
  autoFocusName?: boolean;
  readOnly?: boolean;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddCategory: () => void;
};

export function MenuItemEditorRow({
  item,
  rowErrors,
  categories,
  autoFocusName,
  readOnly = false,
  onItemChange,
  onRemoveItem,
  onAddCategory,
}: MenuItemEditorRowProps) {
  const t = useTranslations("dashboard.menu");
  const [moveOpen, setMoveOpen] = useState(false);
  const [aliasOpen, setAliasOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const aliasPopoverRef = useRef<HTMLDivElement>(null);
  const aliasBtnRef = useRef<HTMLButtonElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Autofocus the name input on first mount when requested.
  useEffect(() => {
    if (autoFocusName && !readOnly) {
      nameInputRef.current?.focus();
    }
    // Run only once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Flash-error state for name and price inputs
  const [nameFlash, setNameFlash] = useState(false);
  const [priceFlash, setPriceFlash] = useState(false);
  const prevNameError = useRef<string | undefined>(undefined);
  const prevPriceError = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (rowErrors.name_bg && !prevNameError.current) {
      setNameFlash(true);
    }
    prevNameError.current = rowErrors.name_bg;
  }, [rowErrors.name_bg]);

  useEffect(() => {
    if (rowErrors.price && !prevPriceError.current) {
      setPriceFlash(true);
    }
    prevPriceError.current = rowErrors.price;
  }, [rowErrors.price]);

  function handleMoveBlur(e: React.FocusEvent) {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(e.relatedTarget as Node) &&
      buttonRef.current !== e.relatedTarget
    ) {
      setMoveOpen(false);
    }
  }

  function handleAliasBlur(e: React.FocusEvent) {
    if (
      aliasPopoverRef.current &&
      !aliasPopoverRef.current.contains(e.relatedTarget as Node) &&
      aliasBtnRef.current !== e.relatedTarget
    ) {
      setAliasOpen(false);
    }
  }

  function handleSelectCategory(cat: string) {
    onItemChange(item.id, "category", cat);
    setMoveOpen(false);
  }

  // Compute EUR equivalent live
  const parsedPrice = parsePrice(item.price);
  const eurText =
    parsedPrice.valid && parsedPrice.value !== null
      ? t("eurAbbrev", { value: formatEur(bgnToEur(parsedPrice.value)) })
      : "—";

  const hasPersisted = Boolean(item.persistedId);

  // ── Read-only render — delegate to MenuItemReadRow ───────────────────────
  if (readOnly) {
    return <MenuItemReadRow item={item} />;
  }

  // ── Edit render ──────────────────────────────────────────────────────────
  return (
    <li className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--bg)]/40">
      {/* Name + description stacked */}
      <div className="min-w-0 flex-1">
        <input
          ref={nameInputRef}
          type="text"
          value={item.name_bg}
          onChange={(e) => onItemChange(item.id, "name_bg", e.target.value)}
          placeholder={t("placeholders.name")}
          aria-invalid={Boolean(rowErrors.name_bg)}
          onAnimationEnd={() => setNameFlash(false)}
          className={[
            "block w-full rounded border border-transparent bg-transparent px-1 font-[var(--f-ui)] text-[15px] font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)] transition-colors",
            nameFlash ? "flash-error" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        />
        {rowErrors.name_bg ? (
          <p className="mt-0.5 text-[11px] text-[var(--bad)]">
            {rowErrors.name_bg}
          </p>
        ) : null}
        <input
          type="text"
          value={item.description_bg}
          onChange={(e) =>
            onItemChange(item.id, "description_bg", e.target.value)
          }
          placeholder={t("descriptionPlaceholder")}
          className="mt-1 block w-full bg-transparent font-[var(--f-ui)] text-[13px] italic leading-[1.5] text-[var(--ink-2)] outline-none placeholder:not-italic placeholder:text-[var(--ink-mute)]/60"
        />
      </div>

      {/* Price + лв suffix + EUR equivalent */}
      <div className="relative flex flex-col items-end gap-0.5">
        <div className="relative flex items-center">
          <input
            type="text"
            inputMode="decimal"
            value={item.price}
            onChange={(e) => onItemChange(item.id, "price", e.target.value)}
            placeholder={t("placeholders.price")}
            aria-invalid={Boolean(rowErrors.price)}
            onAnimationEnd={() => setPriceFlash(false)}
            className={[
              "w-[110px] rounded border border-transparent bg-transparent py-1.5 pr-7 text-right font-[var(--f-mono)] text-[18px] font-medium tabular-nums text-[var(--ink)] outline-none transition-colors focus:border-[var(--rule)] focus:bg-[var(--bg)]/50",
              priceFlash ? "flash-error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          />
          <span className="pointer-events-none absolute right-2 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
            лв
          </span>
        </div>
        <span className="font-[var(--f-mono)] text-[12px] tabular-nums text-[var(--ink-mute)]">
          {eurText}
        </span>
        {rowErrors.price ? (
          <p className="whitespace-nowrap text-right text-[11px] text-[var(--bad)]">
            {rowErrors.price}
          </p>
        ) : null}
      </div>

      {/* Alias manager */}
      <div className="relative">
        <button
          ref={aliasBtnRef}
          type="button"
          disabled={!hasPersisted}
          onClick={() => hasPersisted && setAliasOpen((o) => !o)}
          onBlur={handleAliasBlur}
          title={
            hasPersisted ? t("aliasesButtonAria") : t("aliasesNotSavedHint")
          }
          aria-label={t("aliasesButtonAria")}
          className={[
            "grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] group-hover:opacity-100 focus:opacity-100",
            !hasPersisted ? "cursor-not-allowed opacity-50" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <Tag size={16} strokeWidth={1.5} />
        </button>

        {aliasOpen && hasPersisted ? (
          <AliasManagerPopover
            menuItemId={item.persistedId!}
            menuItemName={item.name_bg}
            onBlur={handleAliasBlur}
            containerRef={aliasPopoverRef}
          />
        ) : null}
      </div>

      {/* Move to category */}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMoveOpen((o) => !o)}
          onBlur={handleMoveBlur}
          title={t("moveTo")}
          aria-label={t("moveItemAria")}
          className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] group-hover:opacity-100 focus:opacity-100"
        >
          <ArrowRightLeft size={16} strokeWidth={1.5} />
        </button>

        {moveOpen ? (
          <div
            ref={popoverRef}
            onBlur={handleMoveBlur}
            tabIndex={-1}
            className="absolute right-0 top-9 z-50 min-w-[160px] rounded-lg border border-[var(--rule)] bg-[var(--paper)] py-1 shadow-[0_8px_24px_-4px_rgba(26,21,18,0.15)]"
          >
            <p className="px-3 py-1.5 font-[var(--f-ui)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              {t("moveTo")}
            </p>
            {categories
              .filter((cat) => cat !== item.category)
              .map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectCategory(cat);
                  }}
                  className="flex w-full items-center px-3 py-2 text-left font-[var(--f-ui)] text-[13px] text-[var(--ink)] hover:bg-[var(--bg)]"
                >
                  {cat || t("uncategorized")}
                </button>
              ))}
            {categories.filter((cat) => cat !== item.category).length > 0 ? (
              <hr className="my-1 border-[var(--rule)]" />
            ) : null}
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                setMoveOpen(false);
                onAddCategory();
              }}
              className="flex w-full items-center px-3 py-2 text-left font-[var(--f-ui)] text-[13px] text-[var(--accent)] hover:bg-[var(--bg)]"
            >
              {t("newCategory")}…
            </button>
          </div>
        ) : null}
      </div>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onRemoveItem(item.id)}
        title={t("table.remove")}
        aria-label={t("table.remove")}
        className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--bad)] group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </li>
  );
}
