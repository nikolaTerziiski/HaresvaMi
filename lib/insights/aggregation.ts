import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";
import {
  MIN_DISH_SAMPLE,
  average,
  compareByName,
  hasCurrentDishSample,
  likeRate,
  menuItemName,
  roundOne,
  windowKeyForSession,
} from "@/lib/insights/aggregation/helpers";
import { pickCommentOfWeek } from "@/lib/insights/comments";
import { resolveInsightPeriod } from "@/lib/insights/period";
import type {
  DishInsight,
  InsightPeriod,
  InsightPeriodTotals,
  InsightWindowKey,
  WeeklyInsights,
} from "@/lib/insights/types";

export function buildInsights(input: {
  sessions: FeedbackSessionRow[];
  ratings: FeedbackRatingRow[];
  menuItems: MenuItemRow[];
  allCompletedSessions: number;
  period: InsightPeriod;
}): WeeklyInsights {
  const { period } = input;
  const currentStart = new Date(period.currentFrom).getTime();
  const currentEnd = new Date(period.currentTo).getTime();
  const previousStart = new Date(period.previousFrom).getTime();
  const menuById = new Map(input.menuItems.map((item) => [item.id, item]));
  const sessionWindows = new Map<string, InsightWindowKey>();
  const windows = {
    current: {
      sessions: 0,
      likes: 0,
      overallResponses: 0,
      ratingSum: 0,
      ratingCount: 0,
    },
    previous: {
      sessions: 0,
      likes: 0,
      overallResponses: 0,
      ratingSum: 0,
      ratingCount: 0,
    },
  };

  input.sessions.forEach((session) => {
    const windowKey = windowKeyForSession(
      session,
      previousStart,
      currentStart,
      currentEnd,
    );

    if (!windowKey) return;

    sessionWindows.set(session.id, windowKey);
    windows[windowKey].sessions += 1;

    if (session.overall_rating === "like") {
      windows[windowKey].likes += 1;
      windows[windowKey].overallResponses += 1;
    } else if (session.overall_rating === "dislike") {
      windows[windowKey].overallResponses += 1;
    }
  });

  const dishBuckets = new Map<
    string,
    {
      currentSum: number;
      currentCount: number;
      previousSum: number;
      previousCount: number;
    }
  >();

  input.ratings.forEach((rating) => {
    const windowKey = sessionWindows.get(rating.session_id);

    if (!windowKey) return;

    const bucket = dishBuckets.get(rating.menu_item_id) ?? {
      currentSum: 0,
      currentCount: 0,
      previousSum: 0,
      previousCount: 0,
    };

    if (windowKey === "current") {
      bucket.currentSum += rating.rating;
      bucket.currentCount += 1;
    } else {
      bucket.previousSum += rating.rating;
      bucket.previousCount += 1;
    }

    windows[windowKey].ratingSum += rating.rating;
    windows[windowKey].ratingCount += 1;
    dishBuckets.set(rating.menu_item_id, bucket);
  });

  const dishStats = Array.from(dishBuckets.entries())
    .map(([menuItemId, bucket]) => {
      const currentAverage = average(bucket.currentSum, bucket.currentCount);
      const previousAverage = average(bucket.previousSum, bucket.previousCount);
      const delta =
        currentAverage !== null && previousAverage !== null
          ? roundOne(currentAverage - previousAverage)
          : null;
      const menuItem = menuById.get(menuItemId);

      return {
        menuItemId,
        name: menuItemName(menuItem),
        category: menuItem?.category ?? null,
        currentCount: bucket.currentCount,
        previousCount: bucket.previousCount,
        currentAverage,
        previousAverage,
        delta,
      };
    })
    .sort(
      (left, right) =>
        right.currentCount - left.currentCount ||
        right.previousCount - left.previousCount ||
        compareByName(left, right),
    );

  const dishRanking = dishStats
    .filter((dish) => dish.currentCount > 0)
    .sort(
      (left, right) =>
        (right.currentAverage ?? -Infinity) -
          (left.currentAverage ?? -Infinity) ||
        right.currentCount - left.currentCount ||
        compareByName(left, right),
    );

  const topPerformer =
    dishStats
      .filter(hasCurrentDishSample)
      .sort(
        (left, right) =>
          right.currentAverage - left.currentAverage ||
          right.currentCount - left.currentCount ||
          compareByName(left, right),
      )[0] ?? null;

  const watchDish =
    dishStats
      .filter(
        (dish): dish is DishInsight =>
          hasCurrentDishSample(dish) &&
          (dish.currentAverage <= 3.2 ||
            (dish.previousCount >= MIN_DISH_SAMPLE &&
              dish.delta !== null &&
              dish.delta <= -0.5)),
      )
      .sort(
        (left, right) =>
          (left.delta ?? 0) - (right.delta ?? 0) ||
          left.currentAverage - right.currentAverage ||
          right.currentCount - left.currentCount ||
          compareByName(left, right),
      )[0] ?? null;

  const improvedDish =
    dishStats
      .filter(
        (dish): dish is DishInsight =>
          dish.previousCount >= MIN_DISH_SAMPLE &&
          hasCurrentDishSample(dish) &&
          dish.currentAverage >= 4 &&
          dish.delta !== null &&
          dish.delta >= 0.5,
      )
      .sort(
        (left, right) =>
          (right.delta ?? 0) - (left.delta ?? 0) ||
          right.currentAverage - left.currentAverage ||
          right.currentCount - left.currentCount ||
          compareByName(left, right),
      )[0] ?? null;

  return {
    period,
    windows: {
      current: { start: period.currentFrom, end: period.currentTo },
      previous: { start: period.previousFrom, end: period.previousTo },
    },
    menuItemCount: input.menuItems.filter((item) => !item.deleted_at).length,
    allCompletedSessions: input.allCompletedSessions,
    current: buildPeriodTotals(windows.current),
    previous: buildPeriodTotals(windows.previous),
    dishStats,
    dishRanking,
    topPerformer,
    watchDish,
    improvedDish,
    commentOfWeek: pickCommentOfWeek(
      input.sessions,
      input.ratings,
      menuById,
      sessionWindows,
    ),
    hasPreviousComparison:
      windows.previous.sessions > 0 || windows.previous.ratingCount > 0,
  };
}

export function buildWeeklyInsights(input: {
  sessions: FeedbackSessionRow[];
  ratings: FeedbackRatingRow[];
  menuItems: MenuItemRow[];
  allCompletedSessions: number;
  now?: Date;
}): WeeklyInsights {
  const period = resolveInsightPeriod({ key: "week", now: input.now });

  return buildInsights({ ...input, period });
}

function buildPeriodTotals(period: {
  sessions: number;
  likes: number;
  overallResponses: number;
  ratingSum: number;
  ratingCount: number;
}): InsightPeriodTotals {
  return {
    completedSessions: period.sessions,
    itemRatingCount: period.ratingCount,
    itemAverage: average(period.ratingSum, period.ratingCount),
    likeRate: likeRate(period.likes, period.overallResponses),
    overallResponseCount: period.overallResponses,
  };
}
