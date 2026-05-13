"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { MenuItemEditorRow } from "@/components/dashboard/menu/MenuItemEditorRow";
import type {
  CategoryGroup,
  MenuItemAlias,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuGroupCardProps = {
  group: CategoryGroup;
  validation: ValidationResult;
  aliasesByMenuItem: Map<string, MenuItemAlias[]>;
  onAddItemInCategory: (categoryName: string) => void;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddAliasClick: (menuItemId?: string) => void;
};

export function MenuGroupCard({
  group,
  validation,
  aliasesByMenuItem,
  onAddItemInCategory,
  onItemChange,
  onRemoveItem,
  onAddAliasClick,
}: MenuGroupCardProps) {
  const t = useTranslations("dashboard.menu");
  const groupLabel = group.displayName || t("uncategorized");

  return (
    <div>
      <div className="sticky top-[104px] z-10 flex items-center gap-3 bg-[color-mix(in_oklab,var(--bg)_96%,transparent)] py-2.5 backdrop-blur-sm">
        <span
          className="h-2 w-2 rounded-full"
          style={{ background: group.color }}
        />
        <h3 className="font-[var(--f-display)] text-[22px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]">
          {groupLabel}
        </h3>
        <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          {String(group.items.length).padStart(2, "0")} ·{" "}
          {groupLabel.toLocaleLowerCase("bg-BG")}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--paper)]">
        <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,1.4fr)_120px_52px] gap-0 border-b border-[var(--rule)] bg-[var(--bg)] px-4 py-2.5 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <div className="px-2">{t("fields.name")}</div>
          <div className="px-2">{t("fields.category")}</div>
          <div className="px-2 text-right">{t("fields.price")}</div>
          <div />
        </div>

        {group.items.map((item) => (
          <MenuItemEditorRow
            key={item.id}
            item={item}
            rowErrors={validation.rowErrors[item.id] || {}}
            aliases={
              item.persistedId
                ? (aliasesByMenuItem.get(item.persistedId) ?? [])
                : []
            }
            onItemChange={onItemChange}
            onRemoveItem={onRemoveItem}
            onAddAliasClick={() => onAddAliasClick(item.persistedId)}
          />
        ))}

        <div className="flex items-center gap-2.5 border-t border-[var(--rule)] bg-[var(--bg)] px-4 py-2.5 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
          <button
            type="button"
            onClick={() => onAddItemInCategory(group.displayName)}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--accent)]"
          >
            <Plus className="h-3 w-3" />
            {t("addInCategory", {
              category: groupLabel.toLocaleLowerCase("bg-BG"),
            })}
          </button>
          <div className="flex-1" />
          <span className="inline-flex items-center gap-1.5">
            <span className="rounded border border-[var(--rule)] bg-[color-mix(in_oklab,var(--rule)_40%,transparent)] px-1 py-0.5 text-[10px]">
              ↵
            </span>
            {t("newRowHint")}
          </span>
        </div>
      </div>
    </div>
  );
}
