import type {
  FeedbackSessionRow,
  MenuItemRow,
} from "@/lib/feedback/dashboard-queries";
import type { DishInsight, InsightWindowKey } from "@/lib/insights/types";

export const MIN_DISH_SAMPLE = 3;

export function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}

export function menuItemName(menuItem: MenuItemRow | undefined) {
  if (!menuItem) {
    return "Изтрито ястие";
  }

  return menuItem.deleted_at
    ? `${menuItem.name_bg} (премахнато)`
    : menuItem.name_bg;
}

export function average(sum: number, count: number) {
  return count > 0 ? roundOne(sum / count) : null;
}

export function likeRate(likes: number, responses: number) {
  return responses > 0 ? roundOne((likes / responses) * 100) : null;
}

export function compareByName(left: { name: string }, right: { name: string }) {
  return left.name.localeCompare(right.name, "bg-BG");
}

export function isDishInsight(value: {
  currentAverage: number | null;
}): value is DishInsight {
  return value.currentAverage !== null;
}

export function hasCurrentDishSample(dish: {
  currentAverage: number | null;
  currentCount: number;
}): dish is DishInsight {
  return dish.currentCount >= MIN_DISH_SAMPLE && isDishInsight(dish);
}

export function windowKeyForSession(
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
