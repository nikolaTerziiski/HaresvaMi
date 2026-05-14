"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { MenuItemEditorRow } from "@/components/dashboard/menu/MenuItemEditorRow";
import type {
  CategoryGroup,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuGroupCardProps = {
  group: CategoryGroup;
  validation: ValidationResult;
  categories: string[];
  onAddItemInCategory: (categoryName: string) => void;
  onAddCategory: () => void;
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
};

export function MenuGroupCard({
  group,
  validation,
  categories,
  onAddItemInCategory,
  onAddCategory,
  onItemChange,
  onRemoveItem,
  onRenameCategory,
}: MenuGroupCardProps) {
  const t = useTranslations("dashboard.menu");
  const groupLabel = group.displayName || t("uncategorized");

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(groupLabel);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleNameClick() {
    setDraftName(groupLabel);
    setEditingName(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitRename() {
    setEditingName(false);
    onRenameCategory(group.displayName, draftName);
  }

  function handleNameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitRename();
    } else if (e.key === "Escape") {
      setEditingName(false);
      setDraftName(groupLabel);
    }
  }

  return (
    <article
      className="rounded-lg border border-[var(--rule)]"
      style={{
        backgroundColor: `color-mix(in srgb, ${group.color} 4%, var(--paper))`,
      }}
    >
      {/* Card header */}
      <header className="flex items-baseline gap-4 border-b border-[var(--rule)] px-6 py-5">
        <span
          className="relative top-[-3px] size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
          aria-hidden
        />
        {editingName ? (
          <input
            ref={inputRef}
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            className="min-w-0 flex-1 bg-transparent font-[var(--f-display)] text-[26px] font-normal leading-none text-[var(--ink)] outline-none"
          />
        ) : (
          <h2
            className="cursor-text font-[var(--f-display)] text-[26px] font-normal leading-none text-[var(--ink)] hover:underline hover:decoration-dotted"
            title={t("newCategory")}
            onClick={handleNameClick}
          >
            {groupLabel}
          </h2>
        )}
        <span className="ml-auto font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
          {group.items.length} ястия
        </span>
      </header>

      {/* Items list */}
      <ul className="divide-y divide-[var(--rule)]">
        {group.items.map((item) => (
          <MenuItemEditorRow
            key={item.id}
            item={item}
            rowErrors={validation.rowErrors[item.id] ?? {}}
            categories={categories}
            onItemChange={onItemChange}
            onRemoveItem={onRemoveItem}
            onAddCategory={onAddCategory}
          />
        ))}
      </ul>

      {/* Add-row footer */}
      <div className="border-t border-[var(--rule)] px-6 py-4">
        <button
          type="button"
          onClick={() => onAddItemInCategory(group.displayName)}
          className="inline-flex items-center gap-2 rounded font-[var(--f-ui)] text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
        >
          <Plus size={16} strokeWidth={1.5} />
          {t("addInCategory", {
            category: groupLabel.toLocaleLowerCase("bg-BG"),
          })}
        </button>
      </div>
    </article>
  );
}
