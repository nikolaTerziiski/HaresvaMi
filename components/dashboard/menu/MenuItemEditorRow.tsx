"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

import { MenuAliasChips } from "@/components/dashboard/menu/MenuAliasChips";
import { categoryColorFor } from "@/lib/menu/format";
import type {
  MenuItemAlias,
  MenuItemField,
  MenuItemRow,
  RowError,
} from "@/lib/menu/types";

type MenuItemEditorRowProps = {
  item: MenuItemRow;
  rowErrors: RowError;
  aliases: MenuItemAlias[];
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddAliasClick: () => void;
};

export function MenuItemEditorRow({
  item,
  rowErrors,
  aliases,
  onItemChange,
  onRemoveItem,
  onAddAliasClick,
}: MenuItemEditorRowProps) {
  const t = useTranslations("dashboard.menu");
  const showAliasLine = Boolean(item.persistedId || item.name_bg.trim());

  return (
    <div className="group/row grid grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_120px_52px] gap-0 border-b border-[var(--rule-soft,var(--rule))] px-4 py-1 transition last:border-b-0 hover:bg-[color-mix(in_oklab,var(--accent)_4%,var(--paper))]">
      <div className="px-2">
        <input
          value={item.name_bg}
          onChange={(event) =>
            onItemChange(item.id, "name_bg", event.target.value)
          }
          placeholder={t("placeholders.name")}
          aria-invalid={Boolean(rowErrors.name_bg)}
          className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-2 text-[14px] font-medium text-[var(--ink)] outline-none transition hover:bg-[var(--bg)] focus:border-[var(--accent)] focus:bg-[var(--bg)]"
        />
        {rowErrors.name_bg ? (
          <p className="px-2.5 pt-1 text-[11px] text-[var(--bad)]">
            {rowErrors.name_bg}
          </p>
        ) : null}
        {showAliasLine ? (
          <div className="px-2.5 pb-1">
            <MenuAliasChips
              aliases={aliases}
              canAddAlias={Boolean(item.persistedId)}
              onAddAliasClick={onAddAliasClick}
            />
          </div>
        ) : null}
      </div>

      <div className="px-2 py-1">
        <div className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--rule)] bg-transparent py-1 pr-3 pl-2 transition hover:border-[var(--ink-mute)] hover:bg-[var(--bg)] has-[input:focus]:border-[var(--accent)] has-[input:focus]:bg-[var(--bg)]">
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ background: categoryColorFor(item.category) }}
          />
          <input
            value={item.category}
            onChange={(event) =>
              onItemChange(item.id, "category", event.target.value)
            }
            placeholder={t("placeholders.category")}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--ink-2)] outline-none placeholder:text-[var(--ink-mute)]"
          />
        </div>
      </div>

      <div className="px-2">
        <div className="flex items-center justify-end gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={item.price}
            onChange={(event) =>
              onItemChange(item.id, "price", event.target.value)
            }
            placeholder={t("placeholders.price")}
            aria-invalid={Boolean(rowErrors.price)}
            className="w-full rounded-md border border-transparent bg-transparent px-2.5 py-2 text-right font-[var(--f-mono)] text-[13px] text-[var(--ink)] outline-none transition hover:bg-[var(--bg)] focus:border-[var(--accent)] focus:bg-[var(--bg)]"
          />
          <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
            лв
          </span>
        </div>
        {rowErrors.price ? (
          <p className="px-2.5 pt-1 text-right text-[11px] text-[var(--bad)]">
            {rowErrors.price}
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={() => onRemoveItem(item.id)}
          title={t("table.remove")}
          aria-label={t("table.remove")}
          className="grid h-9 w-9 place-items-center rounded-md text-[var(--ink-mute)] opacity-0 transition hover:bg-[color-mix(in_oklab,var(--bad)_8%,transparent)] hover:text-[var(--bad)] group-hover/row:opacity-100 focus:opacity-100"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
