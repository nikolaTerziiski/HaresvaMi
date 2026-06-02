import { categoryKey, createEmptyRow } from "@/lib/menu/format";
import type { MenuItemRow } from "@/lib/menu/types";

function normalizeCategories(categories: string[]) {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const category of categories) {
    const trimmed = category.trim();
    const key = categoryKey(trimmed);
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }

  return normalized;
}

function hasEnteredDishData(row: MenuItemRow) {
  return Boolean(
    row.persistedId ||
    row.name_bg.trim() ||
    row.price.trim() ||
    row.description_bg.trim(),
  );
}

function uniqueRowCategories(rows: MenuItemRow[], onlyProtected: boolean) {
  return normalizeCategories(
    rows
      .filter((row) => !onlyProtected || hasEnteredDishData(row))
      .map((row) => row.category),
  );
}

export function getManualStarterCategories(rows: MenuItemRow[]) {
  return uniqueRowCategories(rows, false);
}

export function getProtectedManualStarterCategories(rows: MenuItemRow[]) {
  return uniqueRowCategories(rows, true);
}

export function reconcileManualCategoryRows(
  rows: MenuItemRow[],
  selectedCategories: string[],
) {
  const protectedCategories = getProtectedManualStarterCategories(rows);
  const finalCategories = normalizeCategories([
    ...selectedCategories,
    ...protectedCategories,
  ]);
  const finalKeys = new Set(finalCategories.map(categoryKey));

  const keptRows = rows.filter((row) => {
    const trimmedCategory = row.category.trim();
    if (!trimmedCategory) return hasEnteredDishData(row);
    return (
      finalKeys.has(categoryKey(trimmedCategory)) || hasEnteredDishData(row)
    );
  });

  const existingKeys = new Set(
    keptRows
      .map((row) => row.category.trim())
      .filter(Boolean)
      .map(categoryKey),
  );
  const addedRows = finalCategories
    .filter((category) => !existingKeys.has(categoryKey(category)))
    .map(createEmptyRow);

  return {
    rows: [...keptRows, ...addedRows],
    selectedCategories: finalCategories,
    protectedCategories,
    addedRowIds: addedRows.map((row) => row.id),
  };
}
