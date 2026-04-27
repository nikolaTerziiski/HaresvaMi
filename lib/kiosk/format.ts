import type { KioskMenuItem } from "@/lib/kiosk/types";

export function formatPrice(price: number | null) {
  if (price === null) return null;

  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "BGN",
  }).format(price);
}

export function normalizeKioskText(value: string) {
  return value.trim().toLocaleLowerCase("bg-BG");
}

export function formatMenuItemMeta(item: KioskMenuItem) {
  return [item.category, formatPrice(item.price)].filter(Boolean).join(" · ");
}
