"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import {
  MAX_MENU_FILE_SIZE_BYTES,
  MIN_MENU_ITEMS_FOR_NEXT_STEP,
} from "@/lib/menu/constants";
import {
  extractMenuItemsFromFile,
  saveMenuItems,
} from "@/lib/menu/client-actions";
import {
  categoryKey,
  createEmptyRow,
  createRowsFromInitialItems,
  getDirtyRows,
  isBlankNewRow,
  rowsDifferFromInitial,
} from "@/lib/menu/format";
import { buildCategoryFilters, buildGroupedItems } from "@/lib/menu/grouping";
import { useMenuViewState } from "@/hooks/useMenuViewState";
import type {
  InitialMenuItem,
  MenuItemField,
  MenuItemRow,
} from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";

type MenuMode = "empty" | "manual_starter" | "uploading" | "review";

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
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  const {
    editMode,
    setEditMode,
    expandedCategories,
    toggleCategory,
    setCategoryExpanded,
    expandAllFromItems,
    renameCategoryKey,
  } = useMenuViewState(initialItems.length);

  // Mutable baseline used for hasUnsavedChanges comparison.
  const baselineRef = useRef<InitialMenuItem[]>(initialItems);

  // Id of the first new row to autofocus after handleManualStart.
  const focusItemIdRef = useRef<string | null>(null);

  const validationMessages = useMemo(
    () => ({
      nameRequired: t("errors.nameRequired"),
      invalidPrice: t("errors.invalidPrice"),
      duplicateName: t("errors.duplicateName"),
    }),
    [t],
  );
  const validation = useMemo(
    () => validateRows(items, validationMessages),
    [items, validationMessages],
  );
  const hasUnsavedChanges = useMemo(
    () =>
      removedExistingIds.length > 0 ||
      rowsDifferFromInitial(items, baselineRef.current),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, removedExistingIds],
  );
  const totalItems = useMemo(
    () => items.filter((item) => !isBlankNewRow(item)).length,
    [items],
  );
  const allCategories = useMemo(() => buildCategoryFilters(items), [items]);
  const groupedItems = useMemo(
    () =>
      buildGroupedItems({
        items,
        searchQuery,
        selectedCategoryKeys,
      }),
    [items, searchQuery, selectedCategoryKeys],
  );
  const isFiltering =
    searchQuery.trim().length > 0 || selectedCategoryKeys !== null;

  // True when there are unsaved changes but all dirty rows are in hidden categories.
  const hasOnlyHiddenChanges = useMemo(() => {
    if (!hasUnsavedChanges) return false;
    if (selectedCategoryKeys === null) return false;
    if (removedExistingIds.length > 0) return false;
    const dirtyRows = getDirtyRows(items, baselineRef.current);
    if (dirtyRows.length === 0) return false;
    return dirtyRows.every(
      (row) => !selectedCategoryKeys.includes(categoryKey(row.category)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUnsavedChanges, items, selectedCategoryKeys, removedExistingIds]);

  const canSave =
    !isSaving &&
    !validation.hasErrors &&
    validation.validItems.length >= MIN_MENU_ITEMS_FOR_NEXT_STEP;

  function clearCategoryFilter() {
    setSelectedCategoryKeys(null);
  }

  async function handleFileSelect(file: File) {
    if (file.size > MAX_MENU_FILE_SIZE_BYTES) {
      setError(t("errors.fileTooLarge"));
      return;
    }

    setMode("uploading");
    setError(null);

    try {
      const newItems = await extractMenuItemsFromFile({
        file,
        uploadErrorMessage: t("errors.upload"),
        emptyExtractionMessage: t("errors.emptyExtraction"),
      });

      setItems(newItems);
      setEditMode(true);
      expandAllFromItems(newItems);
      setMode("review");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("errors.upload"));
      setMode("empty");
    }
  }

  function handleManualEntry() {
    setMode("manual_starter");
  }

  function handleManualStart(categories: string[]) {
    const newRows = categories
      .map((cat) => cat.trim())
      .filter(Boolean)
      .map((cat) => createEmptyRow(cat));

    if (newRows.length === 0) return;

    focusItemIdRef.current = newRows[0].id;
    setItems(newRows);
    setEditMode(true);
    expandAllFromItems(newRows);
    setMode("review");
  }

  function handleManualBack() {
    setMode("empty");
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
    setMode("empty");
    setConfirmStartOverOpen(false);
  }

  function handleUndo() {
    setItems(createRowsFromInitialItems(baselineRef.current));
    setRemovedExistingIds([]);
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

  useEffect(() => {
    if (!lastSavedAt) return;
    setShowSaveBanner(true);
    const timer = setTimeout(() => {
      setShowSaveBanner(false);
      setLastSavedAt(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastSavedAt]);

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

      const newBaseline: InitialMenuItem[] = items
        .filter((row) => !isBlankNewRow(row))
        .map((row, index) => ({
          id: row.persistedId ?? row.id,
          name_bg: row.name_bg,
          category: row.category || null,
          price:
            currentValidation.validItems.find(
              (v) => v.persistedId === row.persistedId,
            )?.price ?? null,
          description_bg: row.description_bg || null,
          sort_order: index,
        }));

      baselineRef.current = newBaseline;

      setItems((currentItems) =>
        currentItems.map((row) => ({
          ...row,
          persistedId: row.persistedId ?? row.id,
        })),
      );
      setRemovedExistingIds([]);
      setLastSavedAt(new Date());
      setIsSaving(false);
      setSelectedCategoryKeys(null);
      setEditMode(false);
      // expandedCategories preserved as-is

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
    canSave,
    hasUnsavedChanges,
    hasOnlyHiddenChanges,
    lastSavedAt,
    showSaveBanner,
    totalItems,
    allCategories,
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
    handleFileSelect,
    handleManualEntry,
    handleManualStart,
    handleManualBack,
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
    clearCategoryFilter,
  };
}

export type MenuManagerFlow = ReturnType<typeof useMenuManagerFlow>;
