"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { MIN_MENU_ITEMS_FOR_NEXT_STEP } from "@/lib/menu/constants";
import { saveMenuItems } from "@/lib/menu/client-actions";
import {
  categoryKey,
  createEmptyRow,
  createRowsFromInitialItems,
} from "@/lib/menu/format";
import { reconcileManualCategoryRows } from "@/lib/menu/manual-categories";
import * as menuSaveState from "@/lib/menu/save-state";
import { useMenuViewState } from "@/hooks/useMenuViewState";
import { useMenuSaveBanner } from "@/hooks/useMenuSaveBanner";
import { useMenuReviewDerivedState } from "@/hooks/useMenuReviewDerivedState";
import type {
  InitialMenuItem,
  MenuItemField,
  MenuItemRow,
} from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";

type MenuMode = "empty" | "manual_starter" | "review";

type UseMenuManagerFlowInput = {
  restaurantId: string;
  initialItems: InitialMenuItem[];
};

export function useMenuManagerFlow({
  restaurantId,
  initialItems,
}: UseMenuManagerFlowInput) {
  const router = useRouter();
  const t = useTranslations("dashboard.menu");
  const [mode, setMode] = useState<MenuMode>(
    initialItems.length === 0 ? "empty" : "review",
  );
  const [items, setItems] = useState<MenuItemRow[]>(() =>
    createRowsFromInitialItems(initialItems),
  );
  const [removedExistingIds, setRemovedExistingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmStartOverOpen, setConfirmStartOverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryKeys, setSelectedCategoryKeys] = useState<
    string[] | null
  >(null);
  const [manualDraftActive, setManualDraftActive] = useState(false);
  const { setLastSavedAt, showSaveBanner } = useMenuSaveBanner();

  const {
    editMode,
    setEditMode,
    expandedCategories,
    toggleCategory,
    setCategoryExpanded,
    expandAllFromItems,
    renameCategoryKey,
  } = useMenuViewState(initialItems.length);

  const baselineRef = useRef<InitialMenuItem[]>(initialItems);
  const focusItemIdRef = useRef<string | null>(null);

  const {
    validationMessages,
    validation,
    saveValidationMessages,
    hasUnsavedChanges,
    hasOnlyHiddenChanges,
    totalItems,
    allCategories,
    manualStarterCategories,
    protectedManualStarterCategories,
    allGroupedItems,
    groupedItems,
    isFiltering,
  } = useMenuReviewDerivedState({
    items,
    baselineItems: baselineRef.current,
    removedExistingIds,
    selectedCategoryKeys,
    searchQuery,
  });

  function handleManualStart(categories: string[]) {
    const result = reconcileManualCategoryRows(items, categories);

    if (result.rows.length === 0) return;

    focusItemIdRef.current =
      result.addedRowIds[0] ?? (items.length === 0 ? result.rows[0].id : null);
    setItems(result.rows);
    setManualDraftActive(true);
    setEditMode(true);
    expandAllFromItems(result.rows);
    setMode("review");
  }

  function handleManualBack() {
    setMode(manualDraftActive && items.length > 0 ? "review" : "empty");
  }

  function handleEditManualCategories() {
    setSelectedCategoryKeys(null);
    setMode("manual_starter");
  }

  function handleStartOver() {
    setRemovedExistingIds((currentIds) => {
      const idsToRemove = items
        .map((item) => item.persistedId)
        .filter((id): id is string => Boolean(id));

      return Array.from(new Set([...currentIds, ...idsToRemove]));
    });
    setItems([]);
    setError(null);
    setSearchQuery("");
    setSelectedCategoryKeys(null);
    setManualDraftActive(false);
    setMode("empty");
    setConfirmStartOverOpen(false);
  }

  function handleUndo() {
    setItems(createRowsFromInitialItems(baselineRef.current));
    setRemovedExistingIds([]);
    if (baselineRef.current.length === 0) setManualDraftActive(false);
    setError(null);
  }

  function handleItemChange(id: string, field: MenuItemField, value: string) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );
  }

  function handleAddItemInCategory(categoryName: string) {
    setItems((currentItems) => [...currentItems, createEmptyRow(categoryName)]);
    if (categoryName) setCategoryExpanded(categoryKey(categoryName), true);
  }

  function handleRemoveItem(id: string) {
    setItems((currentItems) => {
      const removedItem = currentItems.find((item) => item.id === id);

      if (removedItem?.persistedId) {
        setRemovedExistingIds((currentIds) =>
          currentIds.includes(removedItem.persistedId!)
            ? currentIds
            : [...currentIds, removedItem.persistedId!],
        );
      }

      return currentItems.filter((item) => item.id !== id);
    });
  }

  function handleAddCategory() {
    const existingNames = new Set(allCategories.map((c) => c.displayName));
    const baseName = t("newCategory");
    let name = baseName;
    let counter = 2;
    while (existingNames.has(name)) {
      name = `${baseName} ${counter}`;
      counter++;
    }
    setItems((currentItems) => [...currentItems, createEmptyRow(name)]);
    setCategoryExpanded(categoryKey(name), true);
  }

  function handleRenameCategory(oldCategory: string, newCategory: string) {
    const trimmedNew = newCategory.trim();
    if (!trimmedNew) return;

    const existingNames = new Set(allCategories.map((c) => c.displayName));
    if (trimmedNew !== oldCategory && existingNames.has(trimmedNew)) return;

    renameCategoryKey(oldCategory, trimmedNew);

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.category === oldCategory
          ? { ...item, category: trimmedNew }
          : item,
      ),
    );
  }

  async function handleSave() {
    const currentValidation = validateRows(items, validationMessages);

    if (currentValidation.hasErrors) {
      setError(t("errors.fixBeforeSave"));
      return;
    }

    if (currentValidation.validItems.length < MIN_MENU_ITEMS_FOR_NEXT_STEP) {
      setError(
        t("errors.needMoreItems", { count: MIN_MENU_ITEMS_FOR_NEXT_STEP }),
      );
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveMenuItems({
        restaurantId,
        items: currentValidation.validItems,
        removedExistingIds,
      });

      baselineRef.current = menuSaveState.buildSavedMenuBaseline(
        items,
        currentValidation.validItems,
      );

      setItems(menuSaveState.markRowsPersisted);
      setRemovedExistingIds([]);
      setLastSavedAt(new Date());
      setIsSaving(false);
      setSelectedCategoryKeys(null);
      setManualDraftActive(false);
      setEditMode(false);
      router.refresh();
    } catch (saveError) {
      console.error(saveError);
      setError(t("errors.save"));
      setIsSaving(false);
    }
  }

  return {
    mode,
    error,
    isSaving,
    saveValidationMessages,
    hasUnsavedChanges,
    hasOnlyHiddenChanges,
    showSaveBanner,
    totalItems,
    allCategories,
    manualStarterCategories,
    protectedManualStarterCategories,
    canEditManualCategories: manualDraftActive && mode === "review",
    allGroupedItems,
    groupedItems,
    isFiltering,
    searchQuery,
    selectedCategoryKeys,
    validation,
    confirmStartOverOpen,
    editMode,
    expandedCategories,
    setConfirmStartOverOpen,
    setSearchQuery,
    setSelectedCategoryKeys,
    setEditMode,
    focusItemId: focusItemIdRef.current,
    clearFocusItemId: () => {
      focusItemIdRef.current = null;
    },
    handleManualEntry: () => setMode("manual_starter"),
    handleManualStart,
    handleManualBack,
    handleEditManualCategories,
    handleStartOver,
    handleUndo,
    handleItemChange,
    handleAddItemInCategory,
    handleAddCategory,
    handleRenameCategory,
    handleRemoveItem,
    handleSave,
    toggleCategory,
    setCategoryExpanded,
    clearCategoryFilter: () => setSelectedCategoryKeys(null),
  };
}

export type MenuManagerFlow = ReturnType<typeof useMenuManagerFlow>;
