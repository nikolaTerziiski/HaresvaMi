import { normalizeKioskText } from "@/lib/kiosk/format";
import type {
  KioskMenuItem,
  ReceiptItem,
  SelectedItem,
} from "@/lib/kiosk/types";

export function filterMenuItems(
  menuItems: KioskMenuItem[],
  query: string,
): KioskMenuItem[] {
  const normalizedQuery = normalizeKioskText(query);

  if (!normalizedQuery) return menuItems;

  return menuItems.filter((item) =>
    normalizeKioskText(`${item.name} ${item.category ?? ""}`).includes(
      normalizedQuery,
    ),
  );
}

export function getManualSelectedItems(
  menuItems: KioskMenuItem[],
  selectedIds: Set<string>,
): SelectedItem[] {
  return menuItems
    .filter((item) => selectedIds.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: 1,
    }));
}

export function mapReceiptItems(
  receiptItems: ReceiptItem[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  const menuById = new Map(menuItems.map((item) => [item.id, item]));

  return receiptItems.map((item, index) => {
    const menuItem = item.menu_item_id ? menuById.get(item.menu_item_id) : null;

    return {
      id: item.menu_item_id ?? `receipt-${index}`,
      name: menuItem?.name ?? item.menu_item_name ?? item.raw_text,
      quantity: item.quantity > 0 ? item.quantity : 1,
    };
  });
}
