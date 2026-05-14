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
  createEmptyRow,
  createRowsFromInitialItems,
  isBlankNewRow,
  rowsDifferFromInitial,
} from "@/lib/menu/format";
import { buildCategoryFilters, buildGroupedItems } from "@/lib/menu/grouping";
import type {
  InitialMenuItem,
  MenuItemField,
  MenuItemRow,
} from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";

type MenuMode = "empty" | "uploading" | "review";

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
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(
    null,
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [showSaveBanner, setShowSaveBanner] = useState(false);

  // Mutable baseline used for hasUnsavedChanges comparison.
  // Stored in a ref so updates don't cause re-renders on their own.
  const baselineRef = useRef<InitialMenuItem[]>(initialItems);

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
        selectedCategoryKey,
      }),
    [items, searchQuery, selectedCategoryKey],
  );
  const isFiltering =
    searchQuery.trim().length > 0 || selectedCategoryKey !== null;
  const canSave =
    !isSaving &&
    !validation.hasErrors &&
    validation.validItems.length >= MIN_MENU_ITEMS_FOR_NEXT_STEP;

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
      setMode("review");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : t("errors.upload"));
      setMode("empty");
    }
  }

  function handleManualEntry() {
    setItems([
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
      createEmptyRow(),
    ]);
    setMode("review");
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
    setSelectedCategoryKey(null);
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
  }

  function handleRenameCategory(oldCategory: string, newCategory: string) {
    const trimmedNew = newCategory.trim();
    if (!trimmedNew) return;

    const existingNames = new Set(allCategories.map((c) => c.displayName));
    // Don't allow renaming to an already-existing different category
    if (trimmedNew !== oldCategory && existingNames.has(trimmedNew)) return;

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

      // Build a new baseline from the saved items so hasUnsavedChanges
      // returns false immediately without waiting for a server re-fetch.
      // For items that already had a persistedId we keep it; for newly
      // inserted rows we use the local row id as a placeholder (they will
      // get real DB ids on the next router.refresh()).
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

      // Re-sync items to use the new baseline ids as persistedIds
      setItems((currentItems) =>
        currentItems.map((row) => ({
          ...row,
          persistedId: row.persistedId ?? row.id,
        })),
      );
      setRemovedExistingIds([]);
      setLastSavedAt(new Date());
      setIsSaving(false);

      // Refresh to pull fresh DB rows (new items get real UUIDs)
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
    lastSavedAt,
    showSaveBanner,
    totalItems,
    allCategories,
    groupedItems,
    isFiltering,
    searchQuery,
    selectedCategoryKey,
    validation,
    confirmStartOverOpen,
    setConfirmStartOverOpen,
    setSearchQuery,
    setSelectedCategoryKey,
    handleFileSelect,
    handleManualEntry,
    handleStartOver,
    handleUndo,
    handleItemChange,
    handleAddItemInCategory,
    handleAddCategory,
    handleRenameCategory,
    handleRemoveItem,
    handleSave,
  };
}

export type MenuManagerFlow = ReturnType<typeof useMenuManagerFlow>;
