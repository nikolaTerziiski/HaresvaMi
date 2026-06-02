import { categoryKey, normalizeText } from "@/lib/menu/format";
import type { MenuItemRow, ValidationResult } from "@/lib/menu/types";

export type MenuValidationSummaryCopy = {
  uncategorizedCategory: string;
  needOneItem: string;
  emptyCategory: (category: string) => string;
  missingName: (category: string) => string;
  missingPrice: (category: string, dish: string) => string;
  invalidPrice: (category: string) => string;
  duplicateProducts: (names: string) => string;
};

type BuildMenuValidationSummaryInput = {
  rows: MenuItemRow[];
  validation: ValidationResult;
  copy: MenuValidationSummaryCopy;
};

function displayCategory(row: MenuItemRow, fallback: string) {
  return normalizeText(row.category) || fallback;
}

function isCategoryOnlyDraft(row: MenuItemRow) {
  return Boolean(
    !row.persistedId &&
    normalizeText(row.category) &&
    !normalizeText(row.name_bg) &&
    !normalizeText(row.price) &&
    !normalizeText(row.description_bg),
  );
}

function addCategoryMessage(
  messages: string[],
  seenKeys: Set<string>,
  category: string,
  buildMessage: (category: string) => string,
) {
  const key = categoryKey(category);
  if (seenKeys.has(key)) return;

  seenKeys.add(key);
  messages.push(buildMessage(category));
}

function collectDuplicateProductNames(rows: MenuItemRow[]) {
  const seen = new Map<string, { name: string; count: number }>();

  for (const row of rows) {
    const name = normalizeText(row.name_bg);
    if (!name) continue;

    const key = name.toLocaleLowerCase("bg-BG");
    const current = seen.get(key);

    if (current) {
      current.count += 1;
    } else {
      seen.set(key, { name, count: 1 });
    }
  }

  return Array.from(seen.values())
    .filter((entry) => entry.count > 1)
    .map((entry) => `„${entry.name}“`);
}

export function buildMenuValidationSummary({
  rows,
  validation,
  copy,
}: BuildMenuValidationSummaryInput) {
  const messages: string[] = [];
  const emptyCategories = new Set<string>();
  const missingNameCategories = new Set<string>();
  const missingPriceItems = new Set<string>();
  const invalidPriceCategories = new Set<string>();

  for (const row of rows) {
    const rowError = validation.rowErrors[row.id];
    if (!rowError) continue;

    const category = displayCategory(row, copy.uncategorizedCategory);

    if (isCategoryOnlyDraft(row) && rowError.name_bg) {
      addCategoryMessage(
        messages,
        emptyCategories,
        category,
        copy.emptyCategory,
      );
      continue;
    }

    if (rowError.name_bg && !normalizeText(row.name_bg)) {
      addCategoryMessage(
        messages,
        missingNameCategories,
        category,
        copy.missingName,
      );
    }

    const dishName = normalizeText(row.name_bg);
    const price = normalizeText(row.price);

    if (rowError.price && dishName && !price) {
      const missingPriceKey = `${categoryKey(category)}:${dishName.toLocaleLowerCase("bg-BG")}`;

      if (!missingPriceItems.has(missingPriceKey)) {
        missingPriceItems.add(missingPriceKey);
        messages.push(copy.missingPrice(category, dishName));
      }
    } else if (rowError.price) {
      addCategoryMessage(
        messages,
        invalidPriceCategories,
        category,
        copy.invalidPrice,
      );
    }
  }

  const duplicateNames = collectDuplicateProductNames(rows);
  if (duplicateNames.length > 0) {
    messages.push(copy.duplicateProducts(duplicateNames.join(", ")));
  }

  if (messages.length === 0 && validation.validItems.length === 0) {
    messages.push(copy.needOneItem);
  }

  return messages;
}
