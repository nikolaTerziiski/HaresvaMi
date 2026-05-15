"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Plus } from "lucide-react";

import { MenuItemEditorRow } from "@/components/dashboard/menu/MenuItemEditorRow";
import { isBlankNewRow } from "@/lib/menu/format";
import type {
  CategoryGroup,
  MenuItemField,
  ValidationResult,
} from "@/lib/menu/types";

type MenuGroupCardProps = {
  group: CategoryGroup;
  validation: ValidationResult;
  categories: string[];
  focusItemId?: string;
  readOnly?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
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
  focusItemId,
  readOnly = false,
  expanded = true,
  onToggleExpand,
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
    if (readOnly) return;
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

  // In read mode, filter out blank rows
  const visibleItems = readOnly
    ? group.items.filter((item) => !isBlankNewRow(item))
    : group.items;

  return (
    <article
      className="rounded-lg border border-[var(--rule)]"
      style={{
        backgroundColor: `color-mix(in srgb, ${group.color} 14%, var(--paper))`,
      }}
    >
      {/* Card header */}
      <header className="flex items-baseline gap-4 border-b border-[var(--rule)] px-6 py-5">
        {/* Chevron toggle */}
        <button
          type="button"
          aria-label={t("expandCategoryAria", { name: groupLabel })}
          onClick={onToggleExpand}
          className="relative top-[-2px] flex shrink-0 items-center text-[var(--ink-mute)] transition-colors hover:text-[var(--ink)]"
        >
          <ChevronDown
            size={16}
            strokeWidth={1.5}
            className={[
              "transition-transform duration-150",
              expanded ? "rotate-0" : "-rotate-90",
            ].join(" ")}
          />
        </button>

        {/* Colored dot */}
        <span
          className="relative top-[-3px] size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
          aria-hidden
        />

        {/* Category name — editable only in edit mode */}
        {!readOnly && editingName ? (
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
            className={[
              "font-[var(--f-display)] text-[26px] font-normal leading-none text-[var(--ink)]",
              !readOnly
                ? "cursor-text hover:underline hover:decoration-dotted"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
            title={!readOnly ? t("newCategory") : undefined}
            onClick={handleNameClick}
          >
            {groupLabel}
          </h2>
        )}

        <span className="ml-auto font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
          {visibleItems.length} ястия
        </span>
      </header>

      {/* Items list + footer — only when expanded */}
      {expanded ? (
        <>
          <ul className="divide-y divide-[var(--rule)]">
            {visibleItems.map((item) => (
              <MenuItemEditorRow
                key={item.id}
                item={item}
                rowErrors={validation.rowErrors[item.id] ?? {}}
                categories={categories}
                autoFocusName={item.id === focusItemId}
                readOnly={readOnly}
                onItemChange={onItemChange}
                onRemoveItem={onRemoveItem}
                onAddCategory={onAddCategory}
              />
            ))}
          </ul>

          {/* Add-row footer — hidden in read mode */}
          {!readOnly ? (
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
          ) : null}
        </>
      ) : null}
    </article>
  );
}
