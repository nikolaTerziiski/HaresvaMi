"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreHorizontal, Plus, RotateCcw, Search } from "lucide-react";

import { MenuDishRow } from "@/components/dashboard/menu/MenuDishRow";
import { MenuDishEditor } from "@/components/dashboard/menu/MenuDishEditor";
import { Menu, MenuContent, MenuItem, MenuTrigger } from "@/components/ui/menu";
import { isBlankNewRow } from "@/lib/menu/format";
import type {
  CategoryGroup,
  MenuItemField,
  MenuItemRow,
  ValidationResult,
} from "@/lib/menu/types";

type MenuCategoryDetailProps = {
  group: CategoryGroup;
  validation: ValidationResult;
  categories: string[];
  onItemChange: (id: string, field: MenuItemField, value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddItemInCategory: (categoryName: string) => void;
  onAddCategory: () => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onStartOverClick: () => void;
};

export function MenuCategoryDetail({
  group,
  validation,
  categories,
  onItemChange,
  onRemoveItem,
  onAddItemInCategory,
  onAddCategory,
  onRenameCategory,
  onStartOverClick,
}: MenuCategoryDetailProps) {
  const t = useTranslations("dashboard.menu");

  // Local search state — filters visible rows in this category
  const [search, setSearch] = useState("");

  // Which item's slide-over editor is open (null = none)
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  // Track whether the currently-open item was newly added (to allow discard-delete)
  const newlyAddedIdRef = useRef<string | null>(null);

  // Inline rename state
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(group.displayName);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const groupLabel = group.displayName || t("uncategorized");

  function handleNameClick() {
    setDraftName(groupLabel);
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.select(), 0);
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
    }
  }

  // Items visible in this view — no blank rows, filtered by local search
  const query = search.trim().toLocaleLowerCase("bg-BG");
  const visibleItems = group.items.filter((item) => {
    if (isBlankNewRow(item)) return false;
    if (!query) return true;
    return item.name_bg.toLocaleLowerCase("bg-BG").includes(query);
  });

  const editingItem: MenuItemRow | null =
    editingItemId !== null
      ? (group.items.find((it) => it.id === editingItemId) ?? null)
      : null;

  function openEditor(id: string) {
    setEditingItemId(id);
  }

  function handleAddAndOpen() {
    // Add a new empty row in this category via the flow handler, then mark
    // a sentinel so the useEffect below can open the editor once it arrives
    // in group.items on the next render.
    onAddItemInCategory(group.displayName);
    setEditingItemId("__pending_new__");
  }

  // When the sentinel is active, watch for the new blank row to appear in
  // group.items and transition to its real id. This runs after the parent
  // re-render that propagates the new item.
  useEffect(() => {
    if (editingItemId !== "__pending_new__") return;
    const last = group.items[group.items.length - 1];
    if (last && !last.name_bg && !last.price) {
      newlyAddedIdRef.current = last.id;
      setEditingItemId(last.id);
    }
  }, [editingItemId, group.items]);

  const resolvedEditingItem = editingItem;

  function handleEditorSave(draft: Partial<Record<MenuItemField, string>>) {
    if (!resolvedEditingItem) return;
    const id = resolvedEditingItem.id;
    // Apply each changed field via the existing handler
    for (const [field, value] of Object.entries(draft) as [
      MenuItemField,
      string,
    ][]) {
      if (value !== undefined) {
        onItemChange(id, field, value);
      }
    }
    newlyAddedIdRef.current = null;
    setEditingItemId(null);
  }

  function handleEditorDiscard() {
    if (newlyAddedIdRef.current) {
      // Was a brand-new blank item: remove it so it doesn't pollute state
      onRemoveItem(newlyAddedIdRef.current);
      newlyAddedIdRef.current = null;
    }
    setEditingItemId(null);
  }

  function handleEditorRemove() {
    if (!resolvedEditingItem) return;
    onRemoveItem(resolvedEditingItem.id);
    newlyAddedIdRef.current = null;
    setEditingItemId(null);
  }

  return (
    <div className="flex-1 overflow-y-auto px-12 py-8 max-md:px-4 max-md:py-5">
      {/* Detail header */}
      <div className="mb-1.5 flex items-center gap-3.5">
        {/* Big color dot */}
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: group.color }}
          aria-hidden
        />

        {/* Category name — click to rename */}
        {editingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleNameKeyDown}
            className="min-w-0 flex-1 bg-transparent font-[var(--f-display)] text-[34px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)] outline-none"
          />
        ) : (
          <h2
            className="flex-1 cursor-text font-[var(--f-display)] text-[34px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)] hover:underline hover:decoration-dotted"
            onClick={handleNameClick}
            title={t("newCategory")}
          >
            {groupLabel}
          </h2>
        )}

        {/* Item count badge */}
        <span className="font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
          {t("itemCountPlural", { count: visibleItems.length })}
        </span>

        {/* Overflow menu — start over */}
        <Menu modal={false}>
          <MenuTrigger
            render={
              <button
                type="button"
                aria-label={t("detail.moreActions")}
                className="grid size-8 place-items-center rounded-lg text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)]"
              />
            }
          >
            <MoreHorizontal size={16} strokeWidth={1.5} />
          </MenuTrigger>
          <MenuContent>
            <MenuItem
              className="flex items-center gap-2 text-[var(--bad)]"
              onClick={onStartOverClick}
            >
              <RotateCcw size={14} strokeWidth={1.5} />
              {t("startOver")}
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>

      {/* Subtitle */}
      <p className="mb-5 text-[13.5px] text-[var(--ink-mute)]">
        {t("detail.subtitle")}
      </p>

      {/* Per-category search */}
      <div className="mb-4 flex max-w-[380px] items-center gap-2.5 rounded-[10px] border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-2.5">
        <Search
          size={15}
          strokeWidth={1.5}
          className="shrink-0 text-[var(--ink-mute)]"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("detail.searchPlaceholder", {
            category: groupLabel.toLocaleLowerCase("bg-BG"),
          })}
          className="min-w-0 flex-1 bg-transparent font-[var(--f-ui)] text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
        />
      </div>

      {/* Items panel */}
      <div className="overflow-hidden rounded-xl border border-[var(--rule)] bg-[var(--paper)]">
        {visibleItems.length === 0 && search.trim() ? (
          <p className="px-6 py-8 text-center text-[14px] text-[var(--ink-mute)]">
            {t("noMatchTitle")}
          </p>
        ) : visibleItems.length === 0 ? (
          <p className="px-6 py-8 text-center text-[14px] italic text-[var(--ink-mute)]">
            {t("categoryBoard.emptyPreview")}
          </p>
        ) : (
          visibleItems.map((item) => (
            <MenuDishRow
              key={item.id}
              item={item}
              rowErrors={validation.rowErrors[item.id] ?? {}}
              onEdit={() => openEditor(item.id)}
              onRemove={() => onRemoveItem(item.id)}
            />
          ))
        )}

        {/* Add dish footer row */}
        <button
          type="button"
          onClick={handleAddAndOpen}
          className="flex w-full items-center gap-2.5 border-t border-[var(--rule)] px-6 py-3.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition-colors hover:bg-[color-mix(in_oklab,var(--bg)_40%,transparent)] hover:text-[var(--ink)]"
        >
          <Plus size={13} strokeWidth={1.75} />
          {t("addInCategory", {
            category: groupLabel.toLocaleLowerCase("bg-BG"),
          })}
        </button>
      </div>

      {/* Slide-over editor */}
      {resolvedEditingItem !== null ? (
        <MenuDishEditor
          item={resolvedEditingItem}
          rowErrors={validation.rowErrors[resolvedEditingItem.id] ?? {}}
          categories={categories}
          isNewItem={newlyAddedIdRef.current === resolvedEditingItem.id}
          onSave={handleEditorSave}
          onDiscard={handleEditorDiscard}
          onRemove={handleEditorRemove}
          onAddCategory={onAddCategory}
        />
      ) : null}
    </div>
  );
}
