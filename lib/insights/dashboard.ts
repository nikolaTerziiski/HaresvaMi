import "server-only";

import { cache } from "react";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { buildWeeklyInsights } from "@/lib/insights/aggregation";
import type { InsightsDashboardData } from "@/lib/insights/types";
import {
  countCompletedInsightSessions,
  loadInsightMenuItems,
  loadInsightRatings,
  loadInsightSessions,
} from "@/lib/insights/queries";

const DAY_MS = 24 * 60 * 60 * 1000;

export type {
  CommentOfWeek,
  DishInsight,
  InsightDishStats,
  InsightsDashboardData,
  InsightPeriodTotals,
  WeeklyInsights,
} from "@/lib/insights/types";

export const getInsightsDashboardData = cache(
  async (): Promise<InsightsDashboardData | null> => {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return null;
    }

    const now = new Date();
    const previousStart = new Date(now.getTime() - 14 * DAY_MS).toISOString();
    const nowIso = now.toISOString();
    const [sessions, menuItems, allCompletedSessions] = await Promise.all([
      loadInsightSessions({
        restaurantId: restaurant.id,
        from: previousStart,
        to: nowIso,
      }),
      loadInsightMenuItems(restaurant.id),
      countCompletedInsightSessions(restaurant.id),
    ]);
    const ratings = await loadInsightRatings(
      sessions.map((session) => session.id),
    );
    const insights = buildWeeklyInsights({
      sessions,
      ratings,
      menuItems,
      allCompletedSessions,
      now,
    });

    return {
      user,
      restaurant,
      ...insights,
    };
  },
);
