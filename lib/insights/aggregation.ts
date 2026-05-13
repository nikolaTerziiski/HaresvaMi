import type {
  FeedbackRatingRow,
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";
import { pickCommentOfWeek } from "@/lib/insights/comments";
import type {
  DishInsight,
  InsightPeriodTotals,
  InsightWindowKey,
  WeeklyInsights,
} from "@/lib/insights/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_DISH_SAMPLE = 3;

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

function menuItemName(menuItem: MenuItemRow | undefined) {
  if (!menuItem) {
    return "Изтрито ястие";
  }

  return menuItem.deleted_at
    ? `${menuItem.name_bg} (премахнато)`
    : menuItem.name_bg;
}

function average(sum: number, count: number) {
  return count > 0 ? roundOne(sum / count) : null;
}

function likeRate(likes: number, responses: number) {
  return responses > 0 ? roundOne((likes / responses) * 100) : null;
}

function compareByName(left: { name: string }, right: { name: string }) {
  return left.name.localeCompare(right.name, "bg-BG");
}

function isDishInsight(value: {
  currentAverage: number | null;
}): value is DishInsight {
  return value.currentAverage !== null;
}

function hasCurrentDishSample(dish: {
  currentAverage: number | null;
  currentCount: number;
}): dish is DishInsight {
  return dish.currentCount >= MIN_DISH_SAMPLE && isDishInsight(dish);
}

function windowKeyForSession(
  session: FeedbackSessionRow,
  previousStart: number,
  currentStart: number,
  currentEnd: number,
): InsightWindowKey | null {
  if (!session.completed_at) return null;

  const completedAt = new Date(session.completed_at).getTime();

  if (completedAt >= currentStart && completedAt <= currentEnd) {
    return "current";
  }

  if (completedAt >= previousStart && completedAt < currentStart) {
    return "previous";
  }

  return null;
}

export function buildWeeklyInsights(input: {
  sessions: FeedbackSessionRow[];
  ratings: FeedbackRatingRow[];
  menuItems: MenuItemRow[];
  allCompletedSessions: number;
  now?: Date;
}): WeeklyInsights {
  const now = input.now ?? new Date();
  const currentEnd = now.getTime();
  const currentStart = currentEnd - 7 * DAY_MS;
  const previousStart = currentEnd - 14 * DAY_MS;
  const menuById = new Map(input.menuItems.map((item) => [item.id, item]));
  const sessionWindows = new Map<string, InsightWindowKey>();
  const period = {
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
    period[windowKey].sessions += 1;

    if (session.overall_rating === "like") {
      period[windowKey].likes += 1;
      period[windowKey].overallResponses += 1;
    } else if (session.overall_rating === "dislike") {
      period[windowKey].overallResponses += 1;
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

    period[windowKey].ratingSum += rating.rating;
    period[windowKey].ratingCount += 1;
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

      return {
        menuItemId,
        name: menuItemName(menuById.get(menuItemId)),
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
    windows: {
      current: {
        start: new Date(currentStart).toISOString(),
        end: now.toISOString(),
      },
      previous: {
        start: new Date(previousStart).toISOString(),
        end: new Date(currentStart).toISOString(),
      },
    },
    menuItemCount: input.menuItems.filter((item) => !item.deleted_at).length,
    allCompletedSessions: input.allCompletedSessions,
    current: buildPeriodTotals(period.current),
    previous: buildPeriodTotals(period.previous),
    dishStats,
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
      period.previous.sessions > 0 || period.previous.ratingCount > 0,
  };
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
