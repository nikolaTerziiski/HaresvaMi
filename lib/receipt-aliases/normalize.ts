export const RECEIPT_ALIAS_MAX_LENGTH = 120;

export function normalizeReceiptAlias(rawText: string): string {
  return rawText
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("bg-BG")
    .slice(0, RECEIPT_ALIAS_MAX_LENGTH);
}
