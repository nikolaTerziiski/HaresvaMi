"use client";

import { useTranslations } from "next-intl";
import { Camera, Pencil, Trash2 } from "lucide-react";

import { parsePrice } from "@/lib/menu/format";
import { bgnToEur, formatEur } from "@/lib/menu/currency";
import type { MenuItemRow, RowError } from "@/lib/menu/types";

type MenuDishRowProps = {
  item: MenuItemRow;
  rowErrors: RowError;
  onEdit: () => void;
  onRemove: () => void;
};

export function MenuDishRow({
  item,
  rowErrors,
  onEdit,
  onRemove,
}: MenuDishRowProps) {
  const t = useTranslations("dashboard.menu");

  const parsedPrice = parsePrice(item.price);
  const eurValue =
    parsedPrice.valid && parsedPrice.value !== null
      ? formatEur(bgnToEur(parsedPrice.value))
      : null;

  const hasError = Boolean(rowErrors.name_bg ?? rowErrors.price);

  return (
    // Full row is a clickable div — click anywhere opens editor.
    // The delete button stops propagation.
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className="group grid cursor-pointer grid-cols-[56px_1fr_auto_auto] items-center gap-4 border-b border-[var(--rule-soft)] px-6 py-3.5 transition-colors last:border-b-0 hover:bg-[color-mix(in_oklab,var(--bg)_30%,transparent)]"
    >
      {/* Thumbnail placeholder — no upload per scope */}
      <div className="relative size-14 shrink-0">
        <div className="absolute inset-0 flex items-center justify-center rounded-[9px] border border-[var(--rule)] bg-[var(--bg-2)] text-[var(--ink-mute)] transition-colors group-hover:border-[color-mix(in_oklab,var(--accent)_35%,var(--rule))] group-hover:text-[var(--accent)]">
          <Camera size={18} strokeWidth={1.5} />
        </div>
      </div>

      {/* Name + description */}
      <div className="min-w-0">
        <p
          className={[
            "text-[15px] font-medium leading-snug",
            hasError ? "text-[var(--bad)]" : "text-[var(--ink)]",
          ].join(" ")}
        >
          {item.name_bg.trim() || (
            <span className="italic text-[var(--ink-mute)]">
              {t("itemUntitled")}
            </span>
          )}
          {hasError ? (
            <span
              className="ml-2 inline-block size-2 rounded-full bg-[var(--bad)] align-middle"
              title={rowErrors.name_bg ?? rowErrors.price}
            />
          ) : null}
        </p>
        {item.description_bg.trim() ? (
          <p className="mt-0.5 truncate text-[13px] italic text-[var(--ink-mute)]">
            {item.description_bg}
          </p>
        ) : (
          <p className="mt-0.5 text-[13px] italic text-[color-mix(in_oklab,var(--ink-mute)_70%,transparent)]">
            {t("dishRow.noDescription")}
          </p>
        )}
      </div>

      {/* Price block */}
      <div className="text-right">
        <div className="font-[var(--f-mono)] text-[16px] font-medium tabular-nums text-[var(--ink)]">
          {item.price.trim() ? (
            <>
              {item.price.trim()}
              <small className="ml-1 text-[11px] font-normal text-[var(--ink-mute)]">
                лв
              </small>
            </>
          ) : (
            <span className="text-[var(--ink-mute)]">—</span>
          )}
        </div>
        {eurValue !== null ? (
          <div className="mt-0.5 font-[var(--f-mono)] text-[11px] tabular-nums text-[var(--ink-mute)]">
            ≈ {eurValue} €
          </div>
        ) : null}
      </div>

      {/* Hover action icons */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          title={t("dishRow.editAria")}
          aria-label={t("dishRow.editAria")}
          className="grid size-[30px] place-items-center rounded-[7px] text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
        >
          <Pencil size={15} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title={t("table.remove")}
          aria-label={t("table.remove")}
          className="grid size-[30px] place-items-center rounded-[7px] text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--bad)]"
        >
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
