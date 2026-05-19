import type { MenuImportResult } from "@/lib/menu/import-types";

function draftKey(restaurantId: string) {
  return `haresvami:menu-import-draft:${restaurantId}`;
}

export function saveImportDraft(
  restaurantId: string,
  result: MenuImportResult,
) {
  try {
    localStorage.setItem(draftKey(restaurantId), JSON.stringify(result));
  } catch {
    // localStorage unavailable — silent fail
  }
}

export function clearImportDraft(restaurantId: string) {
  try {
    localStorage.removeItem(draftKey(restaurantId));
  } catch {
    // ignore
  }
}

export function loadImportDraft(restaurantId: string): MenuImportResult | null {
  try {
    const raw = localStorage.getItem(draftKey(restaurantId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "items" in parsed &&
      Array.isArray((parsed as Record<string, unknown>).items)
    ) {
      return parsed as MenuImportResult;
    }
    return null;
  } catch {
    return null;
  }
}
