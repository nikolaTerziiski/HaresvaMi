import "server-only";

import { cache } from "react";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { buildInsights } from "@/lib/insights/aggregation";
import type {
  InsightsDashboardData,
  InsightPeriodKey,
} from "@/lib/insights/types";
import { resolveInsightPeriod } from "@/lib/insights/period";
import {
  countCompletedInsightSessions,
  loadInsightMenuItems,
  loadInsightRatings,
  loadInsightSessions,
} from "@/lib/insights/queries";

export type {
  CommentOfWeek,
  DishInsight,
  InsightDishStats,
  InsightsDashboardData,
  InsightPeriod,
  InsightPeriodKey,
  InsightPeriodTotals,
  WeeklyInsights,
} from "@/lib/insights/types";

export const getInsightsDashboardData = cache(
  async (
    input: { period?: InsightPeriodKey; from?: string; to?: string } = {},
  ): Promise<InsightsDashboardData | null> => {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return null;
    }

    const now = new Date();
    const period = resolveInsightPeriod({
      key: input.period ?? "week",
      from: input.from,
      to: input.to,
      now,
    });

    const [sessions, menuItems, allCompletedSessions] = await Promise.all([
      loadInsightSessions({
        restaurantId: restaurant.id,
        from: period.previousFrom,
        to: period.currentTo,
      }),
      loadInsightMenuItems(restaurant.id),
      countCompletedInsightSessions(restaurant.id),
    ]);
    const ratings = await loadInsightRatings(
      sessions.map((session) => session.id),
    );
    const insights = buildInsights({
      sessions,
      ratings,
      menuItems,
      allCompletedSessions,
      period,
    });

    return {
      user,
      restaurant,
      ...insights,
    };
  },
);
