export function buildMenuExtractionPrompt(): string {
  return `
You are an expert menu parser for a Bulgarian restaurant application.

Extract the food and drink items from the provided image or PDF of a restaurant menu.

Return ONLY valid JSON in this exact shape, with no markdown or explanation:
{
  "items": [
    {
      "name_bg": "The name of the dish in Bulgarian (exactly as written, but properly capitalized)",
      "category": "The category of the dish (e.g., 'Салати', 'Основни ястия', 'Напитки'). If not explicitly stated, infer a reasonable category in Bulgarian. If completely unknown, use null.",
      "price": number (The price in BGN as a float. If no price is found, use null),
      "description_bg": "The description of the dish in Bulgarian if present. Otherwise, use null."
    }
  ]
}

Rules:
1. Ignore headings that are just restaurant names, addresses, or decorative text.
2. If an item has multiple sizes/prices, either pick the main one or create separate entries (e.g., "Пица Маргарита (Малка)").
3. Ensure prices are pure numbers (e.g., 12.50 instead of "12.50 лв.").
4. If the image is completely unreadable or not a menu, return: {"items": [], "error": "unreadable"}
`.trim();
}

export {
  buildReceiptExtractionPrompt,
  type ReceiptPromptAlias,
  type ReceiptPromptMenuItem,
} from "./prompts/receipt-extraction";
