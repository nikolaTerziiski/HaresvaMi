import "server-only";

import { cache } from "react";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import type {
  FeedbackCommentSummary,
  FeedbackDashboardData,
  MenuItemRatingSummary,
  OverallFeedbackRating,
} from "@/lib/feedback/dashboard-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type {
  FeedbackCommentSummary,
  FeedbackDashboardData,
  MenuItemRatingSummary,
  OverallFeedbackRating,
  RecentFeedbackSession,
} from "@/lib/feedback/dashboard-types";

const PAGE_SIZE = 1000;
const SESSION_ID_CHUNK_SIZE = 500;

type FeedbackSessionRow =
  Database["public"]["Tables"]["feedback_sessions"]["Row"];
type FeedbackRatingRow =
  Database["public"]["Tables"]["feedback_ratings"]["Row"];
type MenuItemRow = Database["public"]["Tables"]["menu_items"]["Row"];

function roundRating(value: number) {
  return Math.round(value * 10) / 10;
}

function isOverallRating(value: string | null): value is OverallFeedbackRating {
  return value === "like" || value === "dislike";
}

function cleanComment(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function menuItemName(menuItem: MenuItemRow | undefined) {
  if (!menuItem) {
    return "Изтрито ястие";
  }

  return menuItem.deleted_at
    ? `${menuItem.name_bg} (премахнато)`
    : menuItem.name_bg;
}

async function loadCompletedSessions(restaurantId: string) {
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

async function loadRatingsForSessions(sessionIds: string[]) {
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

async function loadRestaurantMenuItems(restaurantId: string) {
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

function groupRatingsBySession(ratings: FeedbackRatingRow[]) {
  const bySession = new Map<string, FeedbackRatingRow[]>();

  ratings.forEach((rating) => {
    const existing = bySession.get(rating.session_id) ?? [];
    existing.push(rating);
    bySession.set(rating.session_id, existing);
  });

  return bySession;
}

function buildMenuItemAverages(
  ratings: FeedbackRatingRow[],
  menuById: Map<string, MenuItemRow>,
) {
  const stats = new Map<
    string,
    {
      sum: number;
      count: number;
      latestRatingAt: string | null;
    }
  >();

  ratings.forEach((rating) => {
    const current = stats.get(rating.menu_item_id) ?? {
      sum: 0,
      count: 0,
      latestRatingAt: null,
    };

    stats.set(rating.menu_item_id, {
      sum: current.sum + rating.rating,
      count: current.count + 1,
      latestRatingAt:
        !current.latestRatingAt || rating.created_at > current.latestRatingAt
          ? rating.created_at
          : current.latestRatingAt,
    });
  });

  return Array.from(stats.entries())
    .map(([menuItemId, item]) => ({
      menuItemId,
      name: menuItemName(menuById.get(menuItemId)),
      averageRating: roundRating(item.sum / item.count),
      ratingCount: item.count,
      latestRatingAt: item.latestRatingAt,
    }))
    .sort(
      (left, right) =>
        right.ratingCount - left.ratingCount ||
        left.name.localeCompare(right.name, "bg-BG"),
    );
}

function buildRecentSessions(
  sessions: FeedbackSessionRow[],
  ratingsBySession: Map<string, FeedbackRatingRow[]>,
  menuById: Map<string, MenuItemRow>,
) {
  return sessions.slice(0, 8).map((session) => {
    const ratings = ratingsBySession.get(session.id) ?? [];
    const averageItemRating =
      ratings.length > 0
        ? roundRating(
            ratings.reduce((sum, rating) => sum + rating.rating, 0) /
              ratings.length,
          )
        : null;
    const itemNames = Array.from(
      new Set(
        ratings.map((rating) =>
          menuItemName(menuById.get(rating.menu_item_id)),
        ),
      ),
    ).slice(0, 4);

    return {
      id: session.id,
      completedAt: session.completed_at ?? session.created_at,
      overallRating: isOverallRating(session.overall_rating)
        ? session.overall_rating
        : null,
      overallComment: cleanComment(session.overall_comment),
      itemRatingCount: ratings.length,
      averageItemRating,
      itemNames,
    };
  });
}

function buildLatestComments(
  sessions: FeedbackSessionRow[],
  ratings: FeedbackRatingRow[],
  menuById: Map<string, MenuItemRow>,
) {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const comments: FeedbackCommentSummary[] = [];

  sessions.forEach((session) => {
    const text = cleanComment(session.overall_comment);

    if (!text) return;

    comments.push({
      id: `overall-${session.id}`,
      type: "overall",
      text,
      completedAt: session.completed_at ?? session.created_at,
      overallRating: isOverallRating(session.overall_rating)
        ? session.overall_rating
        : null,
    });
  });

  ratings.forEach((rating) => {
    const text = cleanComment(rating.comment);
    const session = sessionById.get(rating.session_id);

    if (!text || !session) return;

    comments.push({
      id: rating.id,
      type: "item",
      text,
      completedAt: session.completed_at ?? rating.created_at,
      itemName: menuItemName(menuById.get(rating.menu_item_id)),
      rating: rating.rating,
    });
  });

  return comments
    .sort((left, right) => right.completedAt.localeCompare(left.completedAt))
    .slice(0, 10);
}

function topRated(items: MenuItemRatingSummary[]) {
  return [...items]
    .sort(
      (left, right) =>
        right.averageRating - left.averageRating ||
        right.ratingCount - left.ratingCount ||
        left.name.localeCompare(right.name, "bg-BG"),
    )
    .slice(0, 5);
}

function bottomRated(items: MenuItemRatingSummary[]) {
  return [...items]
    .sort(
      (left, right) =>
        left.averageRating - right.averageRating ||
        right.ratingCount - left.ratingCount ||
        left.name.localeCompare(right.name, "bg-BG"),
    )
    .slice(0, 5);
}

export const getFeedbackDashboardData = cache(
  async (): Promise<FeedbackDashboardData | null> => {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return null;
    }

    const sessions = await loadCompletedSessions(restaurant.id);
    const [ratings, menuItems] = await Promise.all([
      loadRatingsForSessions(sessions.map((session) => session.id)),
      loadRestaurantMenuItems(restaurant.id),
    ]);
    const menuById = new Map(menuItems.map((item) => [item.id, item]));
    const ratingsBySession = groupRatingsBySession(ratings);
    const menuItemAverages = buildMenuItemAverages(ratings, menuById);

    return {
      user,
      restaurant,
      totals: {
        completedSessions: sessions.length,
        overallLike: sessions.filter(
          (session) => session.overall_rating === "like",
        ).length,
        overallDislike: sessions.filter(
          (session) => session.overall_rating === "dislike",
        ).length,
        itemRatings: ratings.length,
      },
      recentSessions: buildRecentSessions(sessions, ratingsBySession, menuById),
      menuItemAverages,
      topRatedDishes: topRated(menuItemAverages),
      bottomRatedDishes: bottomRated(menuItemAverages),
      latestComments: buildLatestComments(sessions, ratings, menuById),
    };
  },
);
