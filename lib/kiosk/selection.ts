import { normalizeKioskText } from "@/lib/kiosk/format";
import type {
  KioskMenuItem,
  ReceiptItem,
  SelectedItem,
} from "@/lib/kiosk/types";

export type FeedbackItemPayload = Pick<
  SelectedItem,
  "id" | "name" | "quantity"
>;

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
      imageUrl: item.imageUrl,
      description: item.description,
    }));
}

export function mapReceiptItems(
  receiptItems: ReceiptItem[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const selectedById = new Map<string, SelectedItem>();

  receiptItems.forEach((item) => {
    if (!item.menu_item_id) return;

    const menuItem = menuById.get(item.menu_item_id);

    if (!menuItem) return;

    const existing = selectedById.get(menuItem.id);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    selectedById.set(menuItem.id, {
      id: menuItem.id,
      name: menuItem.name,
      quantity: (existing?.quantity ?? 0) + quantity,
      imageUrl: menuItem.imageUrl,
      description: menuItem.description,
    });
  });

  return Array.from(selectedById.values());
}

export function toFeedbackItems(
  selectedItems: SelectedItem[],
): FeedbackItemPayload[] {
  return selectedItems.map(({ id, name, quantity }) => ({
    id,
    name,
    quantity,
  }));
}
