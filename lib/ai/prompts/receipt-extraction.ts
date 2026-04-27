export type ReceiptPromptMenuItem = {
  id: string;
  name_bg: string;
};

export type ReceiptPromptAlias = {
  alias: string;
  menu_item_id: string;
};

export function buildReceiptExtractionPrompt(
  menu: ReceiptPromptMenuItem[],
  aliases: ReceiptPromptAlias[],
): string {
  const menuById = new Map(menu.map((item) => [item.id, item.name_bg]));

  return `
You are a receipt parser for a Bulgarian restaurant feedback app.

Extract only food and drink items from the receipt image. Match receipt text to the restaurant menu where possible.

Restaurant menu:
${menu.map((item) => `- "${item.name_bg}" (id: ${item.id})`).join("\n")}

Known receipt aliases:
${aliases
  .map(
    (alias) =>
      `- "${alias.alias}" -> "${menuById.get(alias.menu_item_id) ?? "unknown"}" (menu_item_id: ${alias.menu_item_id})`,
  )
  .join("\n")}

Return ONLY valid JSON in this exact shape, with no markdown or explanation:
{
  "confidence": number between 0 and 1,
  "items": [
    {
      "raw_text": "exact receipt text for the item",
      "menu_item_id": "uuid if matched, otherwise null",
      "menu_item_name": "official menu name if matched, otherwise null",
      "quantity": number,
      "matched_via": "alias" | "fuzzy_match" | "unknown"
    }
  ]
}

Rules:
1. Use aliases first, then fuzzy match against menu names.
2. Use quantity 1 if quantity is unclear.
3. Ignore totals, taxes, service fees, dates, receipt numbers, addresses, EIK numbers, and cashier metadata.
4. Set confidence below 0.65 if the image is blurry, important rows are ambiguous, or most items are unknown.
5. If unreadable, return {"confidence": 0, "items": [], "error": "unreadable"}.
`.trim();
}
