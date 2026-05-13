import assert from "node:assert/strict";
import test from "node:test";

import { buildWeeklyInsights } from "@/lib/insights/aggregation";
import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";

const NOW = new Date("2026-05-13T12:00:00.000Z");
const CURRENT_AT = "2026-05-12T12:00:00.000Z";
const PREVIOUS_AT = "2026-05-02T12:00:00.000Z";

function session(
  id: string,
  completedAt: string,
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
    started_at: completedAt,
    completed_at: completedAt,
    created_at: completedAt,
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
    created_at: CURRENT_AT,
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
    created_at: "2026-05-01T09:00:00.000Z",
    updated_at: "2026-05-01T09:00:00.000Z",
    ...overrides,
  } as MenuItemRow;
}

function ratedSessions(
  prefix: string,
  menuItemId: string,
  values: number[],
  completedAt: string,
) {
  const sessions = values.map((_, index) =>
    session(`${prefix}-session-${index + 1}`, completedAt),
  );
  const ratings = values.map((value, index) =>
    rating(
      `${prefix}-rating-${index + 1}`,
      sessions[index].id,
      menuItemId,
      value,
      { created_at: completedAt },
    ),
  );

  return { sessions, ratings };
}

test("a single one-star rating does not trigger a watch dish insight", () => {
  const low = ratedSessions("low", "item-kebapche", [1], CURRENT_AT);
  const insights = buildWeeklyInsights({
    sessions: low.sessions,
    ratings: low.ratings,
    menuItems: [menuItem("item-kebapche", "Кебапче")],
    allCompletedSessions: low.sessions.length,
    now: NOW,
  });

  assert.equal(insights.watchDish, null);
  assert.equal(insights.dishStats[0]?.currentAverage, 1);
  assert.equal(insights.dishStats[0]?.currentCount, 1);
});

test("a dish falling from 4.0 to 3.0 with enough ratings triggers watch", () => {
  const current = ratedSessions(
    "current",
    "item-soup",
    [3, 3, 3, 3, 3],
    CURRENT_AT,
  );
  const previous = ratedSessions(
    "previous",
    "item-soup",
    [4, 4, 4, 4, 4],
    PREVIOUS_AT,
  );
  const insights = buildWeeklyInsights({
    sessions: [...current.sessions, ...previous.sessions],
    ratings: [...current.ratings, ...previous.ratings],
    menuItems: [menuItem("item-soup", "Боб чорба")],
    allCompletedSessions: current.sessions.length + previous.sessions.length,
    now: NOW,
  });

  assert.equal(insights.watchDish?.menuItemId, "item-soup");
  assert.equal(insights.watchDish?.currentAverage, 3);
  assert.equal(insights.watchDish?.previousAverage, 4);
  assert.equal(insights.watchDish?.delta, -1);
});

test("a dish with four current ratings averaging 4.8 is eligible for top performer", () => {
  const current = ratedSessions("top", "item-salad", [5, 5, 5, 4], CURRENT_AT);
  const insights = buildWeeklyInsights({
    sessions: current.sessions,
    ratings: current.ratings,
    menuItems: [menuItem("item-salad", "Шопска салата")],
    allCompletedSessions: current.sessions.length,
    now: NOW,
  });

  assert.equal(insights.topPerformer?.menuItemId, "item-salad");
  assert.equal(insights.topPerformer?.currentAverage, 4.8);
  assert.equal(insights.topPerformer?.currentCount, 4);
});

test("missing previous-week data produces null comparison values", () => {
  const current = ratedSessions("fresh", "item-tarator", [5, 4, 4], CURRENT_AT);
  const insights = buildWeeklyInsights({
    sessions: current.sessions,
    ratings: current.ratings,
    menuItems: [menuItem("item-tarator", "Таратор")],
    allCompletedSessions: current.sessions.length,
    now: NOW,
  });

  const tarator = insights.dishStats.find(
    (dish) => dish.menuItemId === "item-tarator",
  );

  assert.equal(insights.hasPreviousComparison, false);
  assert.equal(insights.previous.completedSessions, 0);
  assert.equal(insights.previous.itemAverage, null);
  assert.equal(tarator?.previousAverage, null);
  assert.equal(tarator?.delta, null);
});

test("improved dish requires enough ratings in both windows", () => {
  const current = ratedSessions(
    "improved-now",
    "item-fish",
    [5, 5, 4],
    CURRENT_AT,
  );
  const previous = ratedSessions(
    "improved-before",
    "item-fish",
    [3, 4, 3],
    PREVIOUS_AT,
  );
  const insights = buildWeeklyInsights({
    sessions: [...current.sessions, ...previous.sessions],
    ratings: [...current.ratings, ...previous.ratings],
    menuItems: [menuItem("item-fish", "Пъстърва")],
    allCompletedSessions: current.sessions.length + previous.sessions.length,
    now: NOW,
  });

  assert.equal(insights.improvedDish?.menuItemId, "item-fish");
  assert.equal(insights.improvedDish?.currentAverage, 4.7);
  assert.equal(insights.improvedDish?.delta, 1.4);
});

test("comment of the week can come from current item comments", () => {
  const current = ratedSessions(
    "comment",
    "item-dessert",
    [5, 5, 5],
    CURRENT_AT,
  );
  const insights = buildWeeklyInsights({
    sessions: current.sessions,
    ratings: [
      current.ratings[0],
      {
        ...current.ratings[1],
        comment: "Много свеж десерт.",
      },
      current.ratings[2],
    ],
    menuItems: [menuItem("item-dessert", "Домашна торта")],
    allCompletedSessions: current.sessions.length,
    now: NOW,
  });

  assert.equal(insights.commentOfWeek?.type, "item");
  assert.equal(insights.commentOfWeek?.text, "Много свеж десерт.");
});

test("deleted menu items keep a readable fallback name", () => {
  const current = ratedSessions("deleted", "item-old", [4, 4, 4], CURRENT_AT);
  const insights = buildWeeklyInsights({
    sessions: current.sessions,
    ratings: current.ratings,
    menuItems: [
      menuItem("item-old", "Стара разядка", {
        deleted_at: "2026-05-10T12:00:00.000Z",
      }),
    ],
    allCompletedSessions: current.sessions.length,
    now: NOW,
  });

  assert.equal(insights.topPerformer?.name, "Стара разядка (премахнато)");
});
