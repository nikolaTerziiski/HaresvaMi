import { CATEGORY_COLORS } from "@/lib/menu/constants";
import type { InitialMenuItem, MenuItemRow } from "@/lib/menu/types";

export function createEmptyRow(category = ""): MenuItemRow {
  return {
    id: crypto.randomUUID(),
    name_bg: "",
    category,
    price: "",
    description_bg: "",
  };
}

export function formatPrice(price: number | null) {
  if (price === null) {
    return "";
  }

  return Number.isInteger(price) ? String(price) : price.toFixed(2);
}

export function createRowsFromInitialItems(
  items: InitialMenuItem[],
): MenuItemRow[] {
  return items.map((item) => ({
    id: item.id,
    persistedId: item.id,
    name_bg: item.name_bg,
    category: item.category ?? "",
    price: formatPrice(item.price),
    description_bg: item.description_bg ?? "",
  }));
}

export function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function parsePrice(value: string): {
  value: number | null;
  valid: boolean;
} {
  const trimmed = value.trim();

  if (!trimmed) {
    return { value: null, valid: true };
  }

  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/лв\.?$/i, "")
    .replace(",", ".");

  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) {
    return { value: null, valid: false };
  }

  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999999.99) {
    return { value: null, valid: false };
  }

  return { value: Math.round(parsed * 100) / 100, valid: true };
}

export function isBlankNewRow(row: MenuItemRow) {
  return (
    !row.persistedId &&
    !row.name_bg.trim() &&
    !row.category.trim() &&
    !row.price.trim() &&
    !row.description_bg.trim()
  );
}

export function categoryKey(name: string): string {
  return name.trim().toLocaleLowerCase("bg-BG");
}

export function categoryColorFor(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "#8A7A68";

  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) | 0;
  }

  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
}

export function rowsDifferFromInitial(
  items: MenuItemRow[],
  initial: InitialMenuItem[],
): boolean {
  const initialById = new Map(initial.map((item) => [item.id, item]));
  let seenPersisted = 0;

  for (const row of items) {
    if (!row.persistedId) {
      if (!isBlankNewRow(row)) return true;
      continue;
    }

    seenPersisted++;
    const initialItem = initialById.get(row.persistedId);

    if (!initialItem) return true;
    if (row.name_bg !== initialItem.name_bg) return true;
    if ((row.category || null) !== initialItem.category) return true;
    if (row.price !== formatPrice(initialItem.price)) return true;
    if ((row.description_bg || null) !== initialItem.description_bg) {
      return true;
    }
  }

  return seenPersisted !== initial.length;
}
