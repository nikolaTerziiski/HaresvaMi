"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Tag, Trash2, X } from "lucide-react";

import { AliasManagerPopover } from "@/components/dashboard/menu/AliasManagerPopover";
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

type MenuDishEditorProps = {
  item: MenuItemRow;
  rowErrors: RowError;
  categories: string[];
  isNewItem: boolean;
  onSave: (draft: Partial<Record<MenuItemField, string>>) => void;
  onDiscard: () => void;
  onRemove: () => void;
  onAddCategory: () => void;
};

/**
 * Slide-over dish editor.
 *
 * Holds a LOCAL draft of the fields. "Запази" calls onSave with the changed
 * fields (caller applies them via handleItemChange). "Откажи" discards — if
 * the item was brand-new, onDiscard should remove it. No DB write here.
 *
 * Rendered as a fixed slide-over on desktop; bottom-sheet on ≤ 560 px.
 * Backdrop + Escape close the panel.
 */
export function MenuDishEditor({
  item,
  rowErrors,
  categories,
  isNewItem,
  onSave,
  onDiscard,
  onRemove,
  onAddCategory,
}: MenuDishEditorProps) {
  const t = useTranslations("dashboard.menu");
  const commonT = useTranslations("common.actions");

  // Local draft — initialised from item on open
  const [draftName, setDraftName] = useState(item.name_bg);
  const [draftDesc, setDraftDesc] = useState(item.description_bg);
  const [draftPrice, setDraftPrice] = useState(item.price);
  const [draftCategory, setDraftCategory] = useState(item.category);
  const [aliasOpen, setAliasOpen] = useState(false);

  const hasPersisted = Boolean(item.persistedId);

  // Re-initialise draft when item identity changes (different dish opened)
  const prevIdRef = useRef(item.id);
  useEffect(() => {
    if (prevIdRef.current !== item.id) {
      prevIdRef.current = item.id;
      setDraftName(item.name_bg);
      setDraftDesc(item.description_bg);
      setDraftPrice(item.price);
      setDraftCategory(item.category);
    }
  }, [item]);

  // Escape key closes
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onDiscard();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDiscard]);

  // Live EUR conversion
  const parsedPrice = parsePrice(draftPrice);
  const eurText =
    parsedPrice.valid && parsedPrice.value !== null
      ? `≈ ${formatEur(bgnToEur(parsedPrice.value))} €`
      : "≈ — €";

  function handleSave() {
    onSave({
      name_bg: draftName,
      description_bg: draftDesc,
      price: draftPrice,
      category: draftCategory,
    });
  }

  const categoryList = Array.from(
    new Set([...categories, draftCategory].filter(Boolean)),
  );

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[198] bg-[rgba(26,21,18,0.4)] transition-opacity duration-200"
        onClick={onDiscard}
        aria-hidden
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t("editor.ariaLabel")}
        className={[
          // Desktop: right slide-over
          "fixed right-0 top-0 z-[199] flex h-[100dvh] w-[460px] max-w-[94vw] flex-col",
          "border-l border-[var(--rule)] bg-[var(--paper)]",
          "shadow-[-24px_0_60px_-20px_rgba(0,0,0,0.22)]",
          // Mobile: bottom sheet
          "max-[560px]:bottom-0 max-[560px]:left-0 max-[560px]:right-0 max-[560px]:top-auto",
          "max-[560px]:h-auto max-[560px]:max-h-[94dvh] max-[560px]:w-full max-[560px]:max-w-none",
          "max-[560px]:rounded-t-[20px] max-[560px]:border-l-0 max-[560px]:border-t",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-[var(--rule)] px-[26px] py-[22px]">
          <div className="flex-1 min-w-0">
            <p className="font-[var(--f-mono)] text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
              {t("editor.eyebrow")}
            </p>
            <h2 className="mt-1 font-[var(--f-display)] text-[26px] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--ink)]">
              {draftName.trim() || t("itemUntitled")}
            </h2>
          </div>
          <button
            type="button"
            onClick={onDiscard}
            aria-label={t("editor.close")}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg)] hover:text-[var(--ink)]"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-[26px] py-6">
          {/* Photo placeholder (disabled per scope) */}
          <p className="mb-2.5 font-[var(--f-mono)] text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
            {t("editor.photoLabel")}
          </p>
          <div className="mb-6 flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-[var(--rule)] bg-[var(--bg-2)] text-[13px] text-[var(--ink-mute)]">
            {t("editor.photoPlaceholder")}
          </div>

          {/* Name */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-2)]">
              {t("editor.nameLabel")}
            </label>
            <input
              type="text"
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder={t("placeholders.name")}
              autoFocus
              className={[
                "w-full rounded-lg border bg-[var(--bg)] px-3.5 py-[11px] font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)]",
                rowErrors.name_bg
                  ? "border-[var(--bad)] focus:border-[var(--bad)]"
                  : "border-[var(--rule)] focus:border-[var(--accent)] focus:bg-[var(--paper)]",
              ].join(" ")}
            />
            {rowErrors.name_bg ? (
              <p className="mt-1 text-[11px] text-[var(--bad)]">
                {rowErrors.name_bg}
              </p>
            ) : null}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-2)]">
              {t("editor.descLabel")}{" "}
              <span className="font-normal text-[var(--ink-mute)]">
                {t("editor.descOptional")}
              </span>
            </label>
            <textarea
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={2}
              placeholder={t("descriptionPlaceholder")}
              className="w-full resize-none rounded-lg border border-[var(--rule)] bg-[var(--bg)] px-3.5 py-[11px] font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)] focus:bg-[var(--paper)]"
            />
          </div>

          {/* Price + EUR */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-2)]">
              {t("editor.priceLabel")}
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={draftPrice}
              onChange={(e) => setDraftPrice(e.target.value)}
              placeholder={t("placeholders.price")}
              className={[
                "w-full rounded-lg border bg-[var(--bg)] px-3.5 py-[11px] font-[var(--f-mono)] text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)]",
                rowErrors.price
                  ? "border-[var(--bad)] focus:border-[var(--bad)]"
                  : "border-[var(--rule)] focus:border-[var(--accent)] focus:bg-[var(--paper)]",
              ].join(" ")}
            />
            <p className="mt-1.5 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
              {eurText}
            </p>
            {rowErrors.price ? (
              <p className="mt-1 text-[11px] text-[var(--bad)]">
                {rowErrors.price}
              </p>
            ) : null}
          </div>

          {/* Category (move-to selector) */}
          <div className="mb-4">
            <label className="mb-1.5 block text-[12px] font-medium text-[var(--ink-2)]">
              {t("editor.categoryLabel")}
            </label>
            <Menu modal={false}>
              <MenuTrigger
                render={
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-lg border border-[var(--rule)] bg-[var(--bg)] px-3.5 py-[11px] font-[var(--f-ui)] text-[14px] text-[var(--ink)] transition-colors hover:border-[var(--ink-mute)] focus:border-[var(--accent)] focus:bg-[var(--paper)] focus:outline-none"
                  />
                }
              >
                <span className="flex-1 text-left">
                  {draftCategory || (
                    <span className="text-[var(--ink-mute)]">
                      {t("uncategorized")}
                    </span>
                  )}
                </span>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  className="shrink-0 text-[var(--ink-mute)]"
                  style={{
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: 1.75,
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </MenuTrigger>
              <MenuContent>
                <MenuGroupLabel>{t("moveTo")}</MenuGroupLabel>
                {categoryList.map((cat) => (
                  <MenuItem
                    key={cat}
                    onClick={() => setDraftCategory(cat)}
                    className={draftCategory === cat ? "font-medium" : ""}
                  >
                    {cat || t("uncategorized")}
                  </MenuItem>
                ))}
                {categoryList.length > 0 ? <MenuSeparator /> : null}
                <MenuItem
                  className="text-[var(--accent)]"
                  onClick={() => {
                    onAddCategory();
                  }}
                >
                  {t("newCategory")}…
                </MenuItem>
              </MenuContent>
            </Menu>
          </div>

          {/* Aliases — secondary affordance for persisted dishes */}
          {hasPersisted ? (
            <div className="mt-2 border-t border-[var(--rule-soft)] pt-4">
              <div className="flex items-center gap-2">
                <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                  {t("editor.aliasesSection")}
                </span>
                <Popover open={aliasOpen} onOpenChange={setAliasOpen}>
                  <PopoverTrigger
                    render={
                      <button
                        type="button"
                        aria-label={t("aliasesButtonAria")}
                        className="inline-flex items-center gap-1.5 rounded border border-[var(--rule)] bg-[var(--paper)] px-2.5 py-1 font-[var(--f-ui)] text-[11px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                      />
                    }
                  >
                    <Tag size={12} strokeWidth={1.5} />
                    {t("aliasesButtonAria")}
                  </PopoverTrigger>
                  {hasPersisted && aliasOpen ? (
                    <AliasManagerPopover
                      menuItemId={item.persistedId!}
                      menuItemName={item.name_bg}
                    />
                  ) : null}
                </Popover>
              </div>
              <p className="mt-1 text-[12px] text-[var(--ink-mute)]">
                {t("editor.aliasesHint")}
              </p>
            </div>
          ) : (
            <p className="mt-4 text-[12px] italic text-[var(--ink-mute)]">
              {t("aliasesNotSavedHint")}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2.5 border-t border-[var(--rule)] px-[26px] py-4">
          {/* Delete — destructive, left-aligned */}
          <button
            type="button"
            onClick={onRemove}
            aria-label={commonT("delete")}
            title={commonT("delete")}
            className="grid size-9 shrink-0 place-items-center rounded-lg border border-[var(--rule)] text-[var(--ink-mute)] transition-colors hover:border-[color-mix(in_oklab,var(--bad)_40%,var(--rule))] hover:bg-[color-mix(in_oklab,var(--bad)_6%,transparent)] hover:text-[var(--bad)]"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>

          <div className="flex-1" />

          {/* Cancel */}
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-[9px] border border-[var(--rule)] px-[18px] py-3 font-[var(--f-ui)] text-[13.5px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            {commonT("cancel")}
          </button>

          {/* Save (local draft only) */}
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-[9px] bg-[var(--accent)] px-4 py-3 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--plum)]"
          >
            {commonT("save")}
          </button>
        </div>
      </aside>
    </>
  );
}
