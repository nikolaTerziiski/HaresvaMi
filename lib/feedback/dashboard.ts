import "server-only";

import { cache } from "react";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  bottomRated,
  buildLatestComments,
  buildMenuItemAverages,
  buildRecentSessions,
  groupRatingsBySession,
  topRated,
} from "@/lib/feedback/dashboard-aggregation";
import type { FeedbackDashboardData } from "@/lib/feedback/dashboard-types";
import {
  loadCompletedSessions,
  loadRatingsForSessions,
  loadRestaurantMenuItems,
} from "@/lib/feedback/dashboard-queries";

export type {
  FeedbackCommentSummary,
  FeedbackDashboardData,
  MenuItemRatingSummary,
  OverallFeedbackRating,
  RecentFeedbackSession,
} from "@/lib/feedback/dashboard-types";

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
