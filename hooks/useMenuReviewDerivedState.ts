"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import { MIN_MENU_ITEMS_FOR_NEXT_STEP } from "@/lib/menu/constants";
import {
  categoryKey,
  getDirtyRows,
  isBlankNewRow,
  rowsDifferFromInitial,
} from "@/lib/menu/format";
import { buildCategoryFilters, buildGroupedItems } from "@/lib/menu/grouping";
import {
  getManualStarterCategories,
  getProtectedManualStarterCategories,
} from "@/lib/menu/manual-categories";
import type { InitialMenuItem, MenuItemRow } from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";
import { buildMenuValidationSummary } from "@/lib/menu/validation-summary";

type UseMenuReviewDerivedStateInput = {
  items: MenuItemRow[];
  baselineItems: InitialMenuItem[];
  removedExistingIds: string[];
  selectedCategoryKeys: string[] | null;
  searchQuery: string;
};

export function useMenuReviewDerivedState({
  items,
  baselineItems,
  removedExistingIds,
  selectedCategoryKeys,
  searchQuery,
}: UseMenuReviewDerivedStateInput) {
  const t = useTranslations("dashboard.menu");
  const validationDialogT = useTranslations("dashboard.menu.validationDialog");

  const validationMessages = useMemo(
    () => ({
      nameRequired: t("errors.nameRequired"),
      priceRequired: t("errors.priceRequired"),
      invalidPrice: t("errors.invalidPrice"),
      duplicateName: t("errors.duplicateName"),
    }),
    [t],
  );

  const validation = useMemo(
    () => validateRows(items, validationMessages),
    [items, validationMessages],
  );

  const saveValidationMessages = useMemo(
    () =>
      buildMenuValidationSummary({
        rows: items,
        validation,
        copy: {
          uncategorizedCategory: validationDialogT("uncategorizedCategory"),
          needOneItem: validationDialogT("needOneItem", {
            count: MIN_MENU_ITEMS_FOR_NEXT_STEP,
          }),
          emptyCategory: (category) =>
            validationDialogT("emptyCategory", { category }),
          missingName: (category) =>
            validationDialogT("missingName", { category }),
          missingPrice: (category, dish) =>
            validationDialogT("missingPrice", { category, dish }),
          invalidPrice: (category) =>
            validationDialogT("invalidPrice", { category }),
          duplicateProducts: (names) =>
            validationDialogT("duplicateProducts", { names }),
        },
      }),
    [items, validation, validationDialogT],
  );

  const hasUnsavedChanges = useMemo(
    () =>
      removedExistingIds.length > 0 ||
      rowsDifferFromInitial(items, baselineItems),
    [items, baselineItems, removedExistingIds],
  );

  const totalItems = useMemo(
    () => items.filter((item) => !isBlankNewRow(item)).length,
    [items],
  );

  const allCategories = useMemo(() => buildCategoryFilters(items), [items]);

  const manualStarterCategories = useMemo(
    () => getManualStarterCategories(items),
    [items],
  );

  const protectedManualStarterCategories = useMemo(
    () => getProtectedManualStarterCategories(items),
    [items],
  );

  const allGroupedItems = useMemo(
    () =>
      buildGroupedItems({
        items,
        searchQuery: "",
        selectedCategoryKeys: null,
      }),
    [items],
  );

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

  const hasOnlyHiddenChanges = useMemo(() => {
    if (!hasUnsavedChanges) return false;
    if (selectedCategoryKeys === null) return false;
    if (removedExistingIds.length > 0) return false;

    const dirtyRows = getDirtyRows(items, baselineItems);
    if (dirtyRows.length === 0) return false;

    return dirtyRows.every(
      (row) => !selectedCategoryKeys.includes(categoryKey(row.category)),
    );
  }, [
    baselineItems,
    hasUnsavedChanges,
    items,
    removedExistingIds,
    selectedCategoryKeys,
  ]);

  return {
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
  };
}
