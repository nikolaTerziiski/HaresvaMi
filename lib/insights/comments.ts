import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";
import type { CommentOfWeek, InsightWindowKey } from "@/lib/insights/types";

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

export function pickCommentOfWeek(
  sessions: FeedbackSessionRow[],
  ratings: FeedbackRatingRow[],
  menuById: Map<string, MenuItemRow>,
  sessionWindows: Map<string, InsightWindowKey>,
): CommentOfWeek | null {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));
  const comments: Array<CommentOfWeek & { id: string }> = [];

  sessions.forEach((session) => {
    if (sessionWindows.get(session.id) !== "current") return;

    const text = cleanComment(session.overall_comment);

    if (!text) return;

    comments.push({
      id: `overall-${session.id}`,
      type: "overall",
      text,
      completedAt: session.completed_at ?? session.created_at,
      overallRating:
        session.overall_rating === "like" ||
        session.overall_rating === "dislike"
          ? session.overall_rating
          : null,
    });
  });

  ratings.forEach((rating) => {
    if (sessionWindows.get(rating.session_id) !== "current") return;

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

  const selected = comments.sort(
    (left, right) =>
      right.completedAt.localeCompare(left.completedAt) ||
      left.id.localeCompare(right.id),
  )[0];

  if (!selected) return null;

  const { id: _id, ...comment } = selected;
  return comment;
}
