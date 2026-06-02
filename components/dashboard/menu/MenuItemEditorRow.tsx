"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRightLeft, Tag, Trash2 } from "lucide-react";

import { AliasManagerPopover } from "@/components/dashboard/menu/AliasManagerPopover";
import { MenuItemReadRow } from "@/components/dashboard/menu/MenuItemReadRow";
import {
  Menu,
  MenuContent,
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/menu";
import { Popover, PopoverTrigger } from "@/components/ui/popover";
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
  const nameInputRef = useRef<HTMLInputElement>(null);
  // Controlled so AliasManagerPopover (which fetches on mount) only mounts when
  // opened — never eagerly for every persisted row on menu load.
  const [aliasOpen, setAliasOpen] = useState(false);

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

  function handleSelectCategory(cat: string) {
    onItemChange(item.id, "category", cat);
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
    <li className="group flex flex-wrap items-start gap-x-3 gap-y-3 px-6 py-4 transition-colors hover:bg-[var(--bg)]/40 sm:flex-nowrap sm:gap-x-4">
      {/* Name + description stacked */}
      <div className="w-full min-w-0 sm:w-auto sm:flex-1">
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
      <div className="ml-auto sm:ml-0">
        <Popover open={aliasOpen} onOpenChange={setAliasOpen}>
          <PopoverTrigger
            disabled={!hasPersisted}
            render={
              <button
                type="button"
                title={
                  hasPersisted
                    ? t("aliasesButtonAria")
                    : t("aliasesNotSavedHint")
                }
                aria-label={t("aliasesButtonAria")}
                className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-100 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] aria-expanded:opacity-100 disabled:cursor-not-allowed disabled:opacity-50 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
              />
            }
          >
            <Tag size={16} strokeWidth={1.5} />
          </PopoverTrigger>
          {hasPersisted && aliasOpen ? (
            <AliasManagerPopover
              menuItemId={item.persistedId!}
              menuItemName={item.name_bg}
            />
          ) : null}
        </Popover>
      </div>

      {/* Move to category */}
      <Menu modal={false}>
        <MenuTrigger
          render={
            <button
              type="button"
              title={t("moveTo")}
              aria-label={t("moveItemAria")}
              className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-100 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] aria-expanded:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
            />
          }
        >
          <ArrowRightLeft size={16} strokeWidth={1.5} />
        </MenuTrigger>
        <MenuContent>
          <MenuGroupLabel>{t("moveTo")}</MenuGroupLabel>
          {categories
            .filter((cat) => cat !== item.category)
            .map((cat) => (
              <MenuItem key={cat} onClick={() => handleSelectCategory(cat)}>
                {cat || t("uncategorized")}
              </MenuItem>
            ))}
          {categories.filter((cat) => cat !== item.category).length > 0 ? (
            <MenuSeparator />
          ) : null}
          <MenuItem
            className="text-[var(--accent)]"
            onClick={() => onAddCategory()}
          >
            {t("newCategory")}…
          </MenuItem>
        </MenuContent>
      </Menu>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onRemoveItem(item.id)}
        title={t("table.remove")}
        aria-label={t("table.remove")}
        className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-100 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--bad)] md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </li>
  );
}
