import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

const PAGE_SIZE = 1000;
const SESSION_ID_CHUNK_SIZE = 500;

export type InsightSessionRow =
  Database["public"]["Tables"]["feedback_sessions"]["Row"];
export type InsightRatingRow =
  Database["public"]["Tables"]["feedback_ratings"]["Row"];
export type InsightMenuItemRow =
  Database["public"]["Tables"]["menu_items"]["Row"];

export async function loadInsightSessions(input: {
  restaurantId: string;
  from: string;
  to: string;
}) {
  const supabase = await createSupabaseServerClient();
  const sessions: InsightSessionRow[] = [];
  let fromIndex = 0;

  while (true) {
    const { data, error } = await supabase
      .from("feedback_sessions")
      .select("*")
      .eq("restaurant_id", input.restaurantId)
      .not("completed_at", "is", null)
      .gte("completed_at", input.from)
      .lte("completed_at", input.to)
      .order("completed_at", { ascending: false })
      .range(fromIndex, fromIndex + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to load insight sessions: ${error.message}`);
    }

    const page = data ?? [];
    sessions.push(...page);

    if (page.length < PAGE_SIZE) {
      return sessions;
    }

    fromIndex += PAGE_SIZE;
  }
}

export async function loadInsightRatings(sessionIds: string[]) {
  if (sessionIds.length === 0) {
    return [];
  }

  const supabase = await createSupabaseServerClient();
  const ratings: InsightRatingRow[] = [];

  for (
    let index = 0;
    index < sessionIds.length;
    index += SESSION_ID_CHUNK_SIZE
  ) {
    const chunk = sessionIds.slice(index, index + SESSION_ID_CHUNK_SIZE);
    let fromIndex = 0;

    while (true) {
      const { data, error } = await supabase
        .from("feedback_ratings")
        .select("*")
        .in("session_id", chunk)
        .order("created_at", { ascending: false })
        .range(fromIndex, fromIndex + PAGE_SIZE - 1);

      if (error) {
        throw new Error(`Unable to load insight ratings: ${error.message}`);
      }

      const page = data ?? [];
      ratings.push(...page);

      if (page.length < PAGE_SIZE) {
        break;
      }

      fromIndex += PAGE_SIZE;
    }
  }

  return ratings;
}

export async function loadInsightMenuItems(restaurantId: string) {
  const supabase = await createSupabaseServerClient();
  const menuItems: InsightMenuItemRow[] = [];
  let fromIndex = 0;

  while (true) {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("name_bg", { ascending: true })
      .range(fromIndex, fromIndex + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Unable to load insight menu items: ${error.message}`);
    }

    const page = data ?? [];
    menuItems.push(...page);

    if (page.length < PAGE_SIZE) {
      return menuItems;
    }

    fromIndex += PAGE_SIZE;
  }
}

export async function countCompletedInsightSessions(restaurantId: string) {
  const supabase = await createSupabaseServerClient();
  const { count, error } = await supabase
    .from("feedback_sessions")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .not("completed_at", "is", null);

  if (error) {
    throw new Error(`Unable to count completed feedback: ${error.message}`);
  }

  return count ?? 0;
}
