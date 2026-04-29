import type {
  FeedbackCommentSummary,
  MenuItemRatingSummary,
  OverallFeedbackRating,
} from "@/lib/feedback/dashboard-types";
import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";

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

export function groupRatingsBySession(ratings: FeedbackRatingRow[]) {
  const bySession = new Map<string, FeedbackRatingRow[]>();

  ratings.forEach((rating) => {
    const existing = bySession.get(rating.session_id) ?? [];
    existing.push(rating);
    bySession.set(rating.session_id, existing);
  });

  return bySession;
}

export function buildMenuItemAverages(
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

export function buildRecentSessions(
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

export function buildLatestComments(
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

export function topRated(items: MenuItemRatingSummary[]) {
  return [...items]
    .sort(
      (left, right) =>
        right.averageRating - left.averageRating ||
        right.ratingCount - left.ratingCount ||
        left.name.localeCompare(right.name, "bg-BG"),
    )
    .slice(0, 5);
}

export function bottomRated(items: MenuItemRatingSummary[]) {
  return [...items]
    .sort(
      (left, right) =>
        left.averageRating - right.averageRating ||
        right.ratingCount - left.ratingCount ||
        left.name.localeCompare(right.name, "bg-BG"),
    )
    .slice(0, 5);
}
