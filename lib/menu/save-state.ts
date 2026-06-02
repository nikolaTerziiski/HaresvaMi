import { isBlankNewRow } from "@/lib/menu/format";
import type {
  InitialMenuItem,
  MenuItemRow,
  ValidatedMenuItem,
} from "@/lib/menu/types";

export function buildSavedMenuBaseline(
  rows: MenuItemRow[],
  validItems: ValidatedMenuItem[],
): InitialMenuItem[] {
  return rows
    .filter((row) => !isBlankNewRow(row))
    .map((row, index) => ({
      id: row.persistedId ?? row.id,
      name_bg: row.name_bg,
      category: row.category || null,
      price:
        validItems.find((item) => item.persistedId === row.persistedId)
          ?.price ?? null,
      description_bg: row.description_bg || null,
      sort_order: index,
    }));
}

export function markRowsPersisted(rows: MenuItemRow[]) {
  return rows.map((row) => ({
    ...row,
    persistedId: row.persistedId ?? row.id,
  }));
}
