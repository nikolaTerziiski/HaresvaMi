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
  const sessions: FeedbackSessionRow[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("feedback_sessions")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(
        `Unable to load completed feedback sessions: ${error.message}`,
      );
    }

    const page = data ?? [];
    sessions.push(...page);

    if (page.length < PAGE_SIZE) {
      return sessions;
    }

    from += PAGE_SIZE;
  }
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
        .select("*")
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
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name_bg", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to load menu items: ${error.message}`);
    }

    const page = data ?? [];
    menuItems.push(...page);

    if (page.length < PAGE_SIZE) {
      return menuItems;
    }

    from += PAGE_SIZE;
  }
}
