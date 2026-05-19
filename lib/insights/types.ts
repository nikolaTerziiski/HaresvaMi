import type { User } from "@supabase/supabase-js";

import type { OwnerRestaurant } from "@/lib/auth/owner";

export type InsightWindowKey = "current" | "previous";

export type InsightPeriodKey = "week" | "month" | "custom";

export type InsightPeriod = {
  key: InsightPeriodKey;
  currentFrom: string;
  currentTo: string;
  previousFrom: string;
  previousTo: string;
};

export type InsightWindow = {
  start: string;
  end: string;
};

export type InsightPeriodTotals = {
  completedSessions: number;
  itemRatingCount: number;
  itemAverage: number | null;
  likeRate: number | null;
  overallResponseCount: number;
};

export type InsightDishStats = {
  menuItemId: string;
  name: string;
  currentCount: number;
  previousCount: number;
  currentAverage: number | null;
  previousAverage: number | null;
  delta: number | null;
};

export type DishInsight = InsightDishStats & {
  currentAverage: number;
};

export type CommentOfWeek =
  | {
      type: "overall";
      text: string;
      completedAt: string;
      overallRating: "like" | "dislike" | null;
    }
  | {
      type: "item";
      text: string;
      completedAt: string;
      itemName: string;
      rating: number;
    };

export type WeeklyInsights = {
  period: InsightPeriod;
  windows: {
    current: InsightWindow;
    previous: InsightWindow;
  };
  menuItemCount: number;
  allCompletedSessions: number;
  current: InsightPeriodTotals;
  previous: InsightPeriodTotals;
  dishStats: InsightDishStats[];
  topPerformer: DishInsight | null;
  watchDish: DishInsight | null;
  improvedDish: DishInsight | null;
  commentOfWeek: CommentOfWeek | null;
  hasPreviousComparison: boolean;
};

export type InsightsDashboardData = WeeklyInsights & {
  user: User;
  restaurant: OwnerRestaurant;
};
