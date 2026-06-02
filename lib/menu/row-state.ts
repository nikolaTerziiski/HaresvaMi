import { normalizeText } from "@/lib/menu/format";
import type { MenuItemRow } from "@/lib/menu/types";

export function hasEnteredDishData(row: MenuItemRow) {
  return Boolean(
    row.persistedId ||
    normalizeText(row.name_bg) ||
    normalizeText(row.price) ||
    normalizeText(row.description_bg),
  );
}

export function isCategoryOnlyDraft(row: MenuItemRow) {
  return Boolean(
    !row.persistedId && normalizeText(row.category) && !hasEnteredDishData(row),
  );
}

export function countEnteredDishRows(rows: MenuItemRow[]) {
  return rows.filter(hasEnteredDishData).length;
}
