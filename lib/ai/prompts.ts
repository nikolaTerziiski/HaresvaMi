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

export function buildMultiFileMenuPrompt(fileNames: string[]): string {
  const fileList = fileNames.map((n, i) => `  ${i + 1}. ${n}`).join("\n");

  return `
Ти си експертна система за разчитане на менюта на български ресторанти.

Предоставени са ти ${fileNames.length === 1 ? "един файл" : `${fileNames.length} файла`} с меню:
${fileList}

Задача: Извлечи ВСИЧКИ ястия и напитки от всички файлове и ги върни като JSON.

ЗАДЪЛЖИТЕЛНИ КАТЕГОРИИ (използвай САМО тях):
  Салати, Супи, Основни, Десерти, Безалкохолни, Алкохол, Гарнитури, Предястия, Скара

Ако не можеш да определиш категорията, използвай "Некласифицирано". НЕ измисляй нови категории.

За всяко ястие включи полето source_file_name — точното име на файла, от който е взето.

Цените могат да са в лева (лв, BGN) или евро (€). Върни само числовата стойност без валута.

Върни ЕДИНСТВЕНО валиден JSON в следния формат без markdown или обяснения:
{
  "items": [
    {
      "name_bg": "Наименование на ястието на български (точно като в менюто, с главна буква)",
      "category": "Категория от списъка по-горе или Некласифицирано",
      "price": 12.50,
      "description_bg": "Описание на български ако има, иначе null",
      "source_file_name": "точното_име_на_файла.jpg"
    }
  ]
}

Правила:
1. Игнорирай заглавия с имена на ресторанти, адреси и декоративен текст.
2. Ако ястие има няколко размера/цени, избери основния или създай отделни записи.
3. Ако файлът е напълно нечетлив или не е меню, не добавяй записи от него.
`.trim();
}

export {
  buildReceiptExtractionPrompt,
  type ReceiptPromptAlias,
  type ReceiptPromptMenuItem,
} from "./prompts/receipt-extraction";
