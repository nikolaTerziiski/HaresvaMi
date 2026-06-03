import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const PAGE_SIZE = 1000;
const SESSION_ID_CHUNK_SIZE = 500;

export type FeedbackSessionRow =
  Database["public"]["Tables"]["feedback_sessions"]["Row"];
export type FeedbackRatingRow =
  Database["public"]["Tables"]["feedback_ratings"]["Row"];
export type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];

export async function loadCompletedSessions(restaurantId: string) {
  const supabase = await createSupabaseServerClient();
  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from("feedback_sessions")
    .select(
      "id, restaurant_id, completed_at, created_at, overall_rating, overall_comment",
    )
    .eq("restaurant_id", restaurantId)
    .not("completed_at", "is", null)
    .gte("completed_at", ninetyDaysAgo)
    .order("completed_at", { ascending: false });

  if (error) {
    throw new Error(
      `Unable to load completed feedback sessions: ${error.message}`,
    );
  }

  return (data ?? []) as FeedbackSessionRow[];
}

export async function loadRatingsForSessions(sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const ratings: FeedbackRatingRow[] = [];

  for (
    let index = 0;
    index < sessionIds.length;
    index += SESSION_ID_CHUNK_SIZE
  ) {
    const chunk = sessionIds.slice(index, index + SESSION_ID_CHUNK_SIZE);
    let from = 0;

    while (true) {
      const { data, error } = await supabase
        .from("feedback_ratings")
        .select("id, session_id, menu_item_id, rating, comment, created_at")
        .in("session_id", chunk)
        .order("created_at", { ascending: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Unable to load feedback ratings: ${error.message}`);
      }

      const page = data ?? [];
      ratings.push(...page);

      if (page.length < PAGE_SIZE) {
        break;
      }

      from += PAGE_SIZE;
    }
  }

  return ratings;
}

export async function loadRestaurantMenuItems(restaurantId: string) {
  const supabase = await createSupabaseServerClient();
  const menuItems: MenuItemRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, restaurant_id, name_bg, deleted_at")
      .eq("restaurant_id", restaurantId)
      .order("name_bg", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to load menu items: ${error.message}`);
    }

    const page = (data ?? []) as MenuItemRow[];
    menuItems.push(...page);

    if (page.length < PAGE_SIZE) {
      return menuItems;
    }

    from += PAGE_SIZE;
  }
}
