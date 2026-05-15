"use client";

import { useState } from "react";

import { categoryKey } from "@/lib/menu/format";
import { buildCategoryFilters } from "@/lib/menu/grouping";
import type { MenuItemRow } from "@/lib/menu/types";

/**
 * Manages edit-mode toggle and per-category collapse/expand state.
 * Extracted from useMenuManagerFlow to keep that hook under 400 lines.
 */
export function useMenuViewState(initialItemCount: number) {
  // false = read-only, true = editable
  const [editMode, setEditMode] = useState<boolean>(initialItemCount === 0);

  // Keys are categoryKey(displayName). Missing key = false (collapsed).
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  function toggleCategory(key: string) {
    setExpandedCategories((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setCategoryExpanded(key: string, value: boolean) {
    setExpandedCategories((prev) => ({ ...prev, [key]: value }));
  }

  /** Expand all categories derived from the given item list. */
  function expandAllFromItems(items: MenuItemRow[]) {
    const cats = buildCategoryFilters(items);
    const expanded: Record<string, boolean> = {};
    for (const cat of cats) expanded[cat.key] = true;
    setExpandedCategories(expanded);
  }

  /** Rename a category key in expandedCategories without losing state. */
  function renameCategoryKey(oldName: string, newName: string) {
    const oldKey = categoryKey(oldName);
    const newKey = categoryKey(newName);
    if (oldKey === newKey) return;
    setExpandedCategories((prev) => {
      const next = { ...prev };
      next[newKey] = prev[oldKey] ?? false;
      delete next[oldKey];
      return next;
    });
  }

  return {
    editMode,
    setEditMode,
    expandedCategories,
    toggleCategory,
    setCategoryExpanded,
    expandAllFromItems,
    renameCategoryKey,
  };
}

export type MenuViewState = ReturnType<typeof useMenuViewState>;
