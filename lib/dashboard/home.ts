import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";

import { getCurrentOwnerState, type OwnerRestaurant } from "@/lib/auth/owner";
import { MIN_MENU_ITEMS_FOR_NEXT_STEP } from "@/lib/menu/constants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const FREE_TIER_FEEDBACK_LIMIT = 50;

export type ChecklistStatus = "done" | "current" | "locked";

export type ChecklistState =
  | "fresh"
  | "menuAdded"
  | "tabletPaired"
  | "waiting"
  | "active";

export type DashboardHomeData = {
  user: User;
  restaurant: OwnerRestaurant;
  ownerFirstName: string;
  greetingKey: "morning" | "afternoon" | "evening";
  menuCount: number;
  feedbackCount: number;
  tabletPaired: boolean;
  tier: string;
  trialEndsAt: string | null;
  usage: {
    used: number;
    limit: number;
  };
  state: ChecklistState;
  steps: {
    restaurant: ChecklistStatus;
    menu: ChecklistStatus;
    tablet: ChecklistStatus;
    feedback: ChecklistStatus;
  };
};

function currentPeriod(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function greetingKey(): "morning" | "afternoon" | "evening" {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Sofia",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );

  if (hour < 11) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

function deriveFirstName(user: User): string {
  const meta = user.user_metadata ?? {};
  const candidates = [
    meta.first_name,
    meta.given_name,
    meta.full_name,
    meta.name,
  ].filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );

  if (candidates.length > 0) {
    return candidates[0].trim().split(/\s+/)[0];
  }

  if (user.email) {
    const local = user.email.split("@")[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return "";
}

export const getDashboardHomeData = cache(
  async (): Promise<DashboardHomeData | null> => {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return null;
    }

    const supabase = await createSupabaseServerClient();
    const period = currentPeriod();

    const [menuResult, feedbackResult, usageResult, restaurantMetaResult] =
      await Promise.all([
        supabase
          .from("menu_items")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id)
          .is("deleted_at", null),
        supabase
          .from("feedback_sessions")
          .select("id", { count: "exact", head: true })
          .eq("restaurant_id", restaurant.id),
        supabase
          .from("usage_counters")
          .select("feedback_count")
          .eq("restaurant_id", restaurant.id)
          .eq("period", period)
          .maybeSingle(),
        supabase
          .from("restaurants")
          .select("tier, trial_ends_at")
          .eq("id", restaurant.id)
          .maybeSingle(),
      ]);

    if (menuResult.error) {
      throw new Error(
        `Unable to count menu items: ${menuResult.error.message}`,
      );
    }
    if (feedbackResult.error) {
      throw new Error(
        `Unable to count feedback sessions: ${feedbackResult.error.message}`,
      );
    }
    if (usageResult.error) {
      throw new Error(
        `Unable to read usage counters: ${usageResult.error.message}`,
      );
    }
    if (restaurantMetaResult.error) {
      throw new Error(
        `Unable to read restaurant tier: ${restaurantMetaResult.error.message}`,
      );
    }

    const menuCount = menuResult.count ?? 0;
    const feedbackCount = feedbackResult.count ?? 0;
    const usageUsed = usageResult.data?.feedback_count ?? feedbackCount;
    const tier = restaurantMetaResult.data?.tier ?? "free";
    const trialEndsAt = restaurantMetaResult.data?.trial_ends_at ?? null;

    // Tablet/device table does not exist yet — treat as never-paired until the
    // tablet feature ships.
    const tabletPaired = false;

    const hasMenu = menuCount >= MIN_MENU_ITEMS_FOR_NEXT_STEP;
    const hasFeedback = feedbackCount > 0;

    let state: ChecklistState;
    if (hasFeedback) {
      state = "active";
    } else if (hasMenu && tabletPaired) {
      state = "waiting";
    } else if (hasMenu) {
      state = "menuAdded";
    } else {
      state = "fresh";
    }

    const steps = {
      restaurant: "done" as ChecklistStatus,
      menu: hasMenu
        ? ("done" as ChecklistStatus)
        : ("current" as ChecklistStatus),
      tablet: !hasMenu
        ? ("locked" as ChecklistStatus)
        : tabletPaired
          ? ("done" as ChecklistStatus)
          : ("current" as ChecklistStatus),
      feedback:
        hasMenu && tabletPaired
          ? hasFeedback
            ? ("done" as ChecklistStatus)
            : ("current" as ChecklistStatus)
          : ("locked" as ChecklistStatus),
    };

    return {
      user,
      restaurant,
      ownerFirstName: deriveFirstName(user),
      greetingKey: greetingKey(),
      menuCount,
      feedbackCount,
      tabletPaired,
      tier,
      trialEndsAt,
      usage: {
        used: usageUsed,
        limit: FREE_TIER_FEEDBACK_LIMIT,
      },
      state,
      steps,
    };
  },
);
