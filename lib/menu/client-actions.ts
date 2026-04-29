"use client";

import { formatPrice } from "@/lib/menu/format";
import type {
  InitialMenuItem,
  MenuItemRow,
  ValidatedMenuItem,
} from "@/lib/menu/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function extractMenuItemsFromFile({
  file,
  uploadErrorMessage,
  emptyExtractionMessage,
}: {
  file: File;
  uploadErrorMessage: string;
  emptyExtractionMessage: string;
}) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/extract-menu", {
    method: "POST",
    body: formData,
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || uploadErrorMessage);
  }

  const items: MenuItemRow[] = (data.items || [])
    .map((item: Partial<InitialMenuItem>) => ({
      id: crypto.randomUUID(),
      name_bg: item.name_bg || "",
      category: item.category || "",
      price: typeof item.price === "number" ? formatPrice(item.price) : "",
      description_bg: item.description_bg || "",
    }))
    .filter((item: MenuItemRow) => item.name_bg.trim().length > 0);

  if (items.length === 0) {
    throw new Error(emptyExtractionMessage);
  }

  return items;
}

export async function saveMenuItems({
  restaurantId,
  items,
  removedExistingIds,
}: {
  restaurantId: string;
  items: ValidatedMenuItem[];
  removedExistingIds: string[];
}) {
  const supabase = createSupabaseBrowserClient();
  const rowsWithIndex = items.map((item, index) => ({ item, index }));
  const existingRows = rowsWithIndex.filter(({ item }) => item.persistedId);
  const newRows = rowsWithIndex.filter(({ item }) => !item.persistedId);
  const uniqueRemovedIds = [...new Set(removedExistingIds)];

  if (uniqueRemovedIds.length > 0) {
    const { error } = await supabase
      .from("menu_items")
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq("restaurant_id", restaurantId)
      .in("id", uniqueRemovedIds);

    if (error) {
      throw error;
    }
  }

  for (const { item, index } of existingRows) {
    const { error } = await supabase
      .from("menu_items")
      .update({
        name_bg: item.name_bg,
        category: item.category,
        price: item.price,
        description_bg: item.description_bg,
        sort_order: index,
        is_active: true,
        deleted_at: null,
      })
      .eq("restaurant_id", restaurantId)
      .eq("id", item.persistedId!);

    if (error) {
      throw error;
    }
  }

  if (newRows.length === 0) {
    return;
  }

  const { error } = await supabase.from("menu_items").insert(
    newRows.map(({ item, index }) => ({
      restaurant_id: restaurantId,
      name_bg: item.name_bg,
      category: item.category,
      price: item.price,
      description_bg: item.description_bg,
      sort_order: index,
      is_active: true,
    })),
  );

  if (error) {
    throw error;
  }
}
