import type { User } from "@supabase/supabase-js";

import type { OwnerRestaurant } from "@/lib/auth/owner";

export type OverallFeedbackRating = "like" | "dislike";

export type MenuItemRatingSummary = {
  menuItemId: string;
  name: string;
  averageRating: number;
  ratingCount: number;
  latestRatingAt: string | null;
};

export type RecentFeedbackSession = {
  id: string;
  completedAt: string;
  overallRating: OverallFeedbackRating | null;
  overallComment: string | null;
  itemRatingCount: number;
  averageItemRating: number | null;
  itemNames: string[];
};

export type FeedbackCommentSummary =
  | {
      id: string;
      type: "overall";
      text: string;
      completedAt: string;
      overallRating: OverallFeedbackRating | null;
    }
  | {
      id: string;
      type: "item";
      text: string;
      completedAt: string;
      itemName: string;
      rating: number;
    };

export type FeedbackDashboardData = {
  user: User;
  restaurant: OwnerRestaurant;
  totals: {
    completedSessions: number;
    overallLike: number;
    overallDislike: number;
    itemRatings: number;
  };
  recentSessions: RecentFeedbackSession[];
  menuItemAverages: MenuItemRatingSummary[];
  topRatedDishes: MenuItemRatingSummary[];
  bottomRatedDishes: MenuItemRatingSummary[];
  latestComments: FeedbackCommentSummary[];
};
