import assert from "node:assert/strict";
import test from "node:test";

import {
  bottomRated,
  buildFeedbackTotals,
  buildLatestComments,
  buildMenuItemAverages,
  buildRecentSessions,
  groupRatingsBySession,
  topRated,
} from "@/lib/feedback/dashboard-aggregation";
import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";

function session(
  id: string,
  overrides: Partial<FeedbackSessionRow> = {},
): FeedbackSessionRow {
  return {
    id,
    restaurant_id: "restaurant-1",
    table_number: null,
    receipt_image_path: null,
    extracted_items: [],
    customer_language: "bg",
    overall_rating: null,
    overall_comment: null,
    started_at: "2026-04-25T10:00:00.000Z",
    completed_at: "2026-04-25T10:05:00.000Z",
    created_at: "2026-04-25T10:00:00.000Z",
    ...overrides,
  } as FeedbackSessionRow;
}

function rating(
  id: string,
  sessionId: string,
  menuItemId: string,
  value: number,
  overrides: Partial<FeedbackRatingRow> = {},
): FeedbackRatingRow {
  return {
    id,
    session_id: sessionId,
    menu_item_id: menuItemId,
    rating: value,
    comment: null,
    created_at: "2026-04-25T10:06:00.000Z",
    ...overrides,
  } as FeedbackRatingRow;
}

function menuItem(
  id: string,
  name: string,
  overrides: Partial<MenuItemRow> = {},
): MenuItemRow {
  return {
    id,
    restaurant_id: "restaurant-1",
    name_bg: name,
    name_en: null,
    description_bg: null,
    description_en: null,
    category: null,
    price: null,
    image_url: null,
    is_active: true,
    sort_order: 0,
    deleted_at: null,
    created_at: "2026-04-25T09:00:00.000Z",
    updated_at: "2026-04-25T09:00:00.000Z",
    ...overrides,
  } as MenuItemRow;
}

const menuItems = [
  menuItem("item-kebapche", "Kebapche"),
  menuItem("item-salad", "Shopska salad"),
  menuItem("item-soup", "Bean soup"),
  menuItem("item-unrated", "Unrated dish"),
];
const menuById = new Map(menuItems.map((item) => [item.id, item]));

const sessions = [
  session("session-1", {
    overall_rating: "like",
    overall_comment: "Great visit",
    completed_at: "2026-04-25T12:00:00.000Z",
  }),
  session("session-2", {
    overall_rating: "dislike",
    completed_at: "2026-04-25T11:00:00.000Z",
  }),
  session("session-3", {
    completed_at: "2026-04-25T10:00:00.000Z",
  }),
];

const ratings = [
  rating("rating-1", "session-1", "item-kebapche", 10, {
    comment: "Loved it",
    created_at: "2026-04-25T12:01:00.000Z",
  }),
  rating("rating-2", "session-2", "item-kebapche", 8, {
    created_at: "2026-04-25T11:01:00.000Z",
  }),
  rating("rating-3", "session-2", "item-salad", 4, {
    comment: "Too salty",
    created_at: "2026-04-25T11:02:00.000Z",
  }),
  rating("rating-4", "session-3", "item-soup", 7, {
    created_at: "2026-04-25T10:01:00.000Z",
  }),
];

test("totals are calculated correctly", () => {
  assert.deepEqual(buildFeedbackTotals(sessions, ratings), {
    completedSessions: 3,
    overallLike: 1,
    overallDislike: 1,
    itemRatings: 4,
  });
});

test("menu item averages are calculated correctly", () => {
  const averages = buildMenuItemAverages(ratings, menuById);
  const kebapche = averages.find((item) => item.menuItemId === "item-kebapche");
  const salad = averages.find((item) => item.menuItemId === "item-salad");

  assert.equal(kebapche?.averageRating, 9);
  assert.equal(kebapche?.ratingCount, 2);
  assert.equal(kebapche?.latestRatingAt, "2026-04-25T12:01:00.000Z");
  assert.equal(salad?.averageRating, 4);
  assert.equal(salad?.ratingCount, 1);
});

test("unrated menu items do not appear in top or bottom rated lists", () => {
  const averages = buildMenuItemAverages(ratings, menuById);
  const topIds = topRated(averages).map((item) => item.menuItemId);
  const bottomIds = bottomRated(averages).map((item) => item.menuItemId);

  assert.equal(
    averages.some((item) => item.menuItemId === "item-unrated"),
    false,
  );
  assert.equal(topIds.includes("item-unrated"), false);
  assert.equal(bottomIds.includes("item-unrated"), false);
});

test("topRated returns highest averages first", () => {
  const top = topRated(buildMenuItemAverages(ratings, menuById));

  assert.deepEqual(
    top.map((item) => item.menuItemId),
    ["item-kebapche", "item-soup", "item-salad"],
  );
});

test("bottomRated returns lowest averages first", () => {
  const bottom = bottomRated(buildMenuItemAverages(ratings, menuById));

  assert.deepEqual(
    bottom.map((item) => item.menuItemId),
    ["item-salad", "item-soup", "item-kebapche"],
  );
});

test("recent sessions include item summaries", () => {
  const recent = buildRecentSessions(
    sessions,
    groupRatingsBySession(ratings),
    menuById,
  );
  const secondSession = recent.find((item) => item.id === "session-2");

  assert.equal(secondSession?.itemRatingCount, 2);
  assert.equal(secondSession?.averageItemRating, 6);
  assert.deepEqual(secondSession?.itemNames, ["Kebapche", "Shopska salad"]);
});

test("latest comments include item comments and overall comments", () => {
  const comments = buildLatestComments(sessions, ratings, menuById);

  assert.deepEqual(
    comments.map((comment) => comment.id),
    ["overall-session-1", "rating-1", "rating-3"],
  );
  assert.equal(
    comments.find((comment) => comment.type === "overall")?.text,
    "Great visit",
  );
  assert.equal(comments.filter((comment) => comment.type === "item").length, 2);
});
