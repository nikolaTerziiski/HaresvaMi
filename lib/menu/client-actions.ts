"use client";

import type { ValidatedMenuItem } from "@/lib/menu/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

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
