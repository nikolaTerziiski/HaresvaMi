import { isBlankNewRow, normalizeText, parsePrice } from "@/lib/menu/format";
import type { MenuItemRow, RowError, ValidationResult } from "@/lib/menu/types";

export type MenuValidationMessages = {
  nameRequired: string;
  invalidPrice: string;
  duplicateName: string;
};

export function validateRows(
  rows: MenuItemRow[],
  messages: MenuValidationMessages,
): ValidationResult {
  const rowErrors: Record<string, RowError> = {};
  const validItems: ValidationResult["validItems"] = [];
  const seenNames = new Map<string, string>();

  for (const row of rows) {
    if (isBlankNewRow(row)) {
      continue;
    }

    const name = normalizeText(row.name_bg);
    const category = normalizeText(row.category);
    const description = normalizeText(row.description_bg);
    const parsedPrice = parsePrice(row.price);
    const errors: RowError = {};

    if (!name) {
      errors.name_bg = messages.nameRequired;
    }

    if (!parsedPrice.valid) {
      errors.price = messages.invalidPrice;
    }

    if (name) {
      const normalizedName = name.toLocaleLowerCase("bg-BG");
      const firstRowId = seenNames.get(normalizedName);

      if (firstRowId) {
        errors.name_bg = messages.duplicateName;
        rowErrors[firstRowId] = {
          ...rowErrors[firstRowId],
          name_bg: messages.duplicateName,
        };
      } else {
        seenNames.set(normalizedName, row.id);
      }
    }

    if (Object.keys(errors).length > 0) {
      rowErrors[row.id] = { ...rowErrors[row.id], ...errors };
      continue;
    }

    validItems.push({
      persistedId: row.persistedId,
      name_bg: name,
      category: category || null,
      price: parsedPrice.value,
      description_bg: description || null,
    });
  }

  return {
    validItems,
    rowErrors,
    hasErrors: Object.keys(rowErrors).length > 0,
  };
}
