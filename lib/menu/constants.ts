export const MIN_MENU_ITEMS_FOR_NEXT_STEP = 1;
export const MAX_MENU_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const SUGGESTED_MANUAL_CATEGORIES = [
  "Салати",
  "Супи",
  "Основни",
  "Десерти",
  "Напитки",
  "Алкохол",
] as const;

// AI menu import extracts food only — drinks are filtered out at the prompt
// level. The popover in the review screen uses this list (plus
// "Некласифицирано" when relevant) for the "move to category" options.
export const AI_IMPORT_FOOD_CATEGORIES = [
  "Салати",
  "Супи",
  "Предястия",
  "Основни",
  "Скара",
  "Гарнитури",
  "Десерти",
] as const;

export const CATEGORY_COLORS = [
  "#7A9B5A",
  "#C24D2C",
  "#D98F3E",
  "#5B2A2A",
  "#B88FA0",
  "#3F6B4E",
  "#8A7A68",
  "#E89A3C",
];
