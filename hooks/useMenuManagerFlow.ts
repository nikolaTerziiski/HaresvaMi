"use client";

import { useMemo, useState } from "react";
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
  MenuAliasTarget,
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
      rowsDifferFromInitial(items, initialItems),
    [items, removedExistingIds, initialItems],
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
  const aliasTargets: MenuAliasTarget[] = useMemo(
    () =>
      items
        .filter(
          (item): item is MenuItemRow & { persistedId: string } =>
            Boolean(item.persistedId) && item.name_bg.trim().length > 0,
        )
        .map((item) => ({
          id: item.persistedId,
          name_bg: item.name_bg,
          category: item.category,
          price: item.price,
        })),
    [items],
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
    setItems(createRowsFromInitialItems(initialItems));
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

      router.push("/dashboard");
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
    totalItems,
    allCategories,
    groupedItems,
    aliasTargets,
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
    handleRemoveItem,
    handleSave,
  };
}

export type MenuManagerFlow = ReturnType<typeof useMenuManagerFlow>;
