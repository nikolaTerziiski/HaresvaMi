import "server-only";

import {
  getFeedbackEntitlement,
  type EntitlementResult,
} from "@/lib/billing/entitlements-core";
import {
  getCurrentUsagePeriod,
  getMonthlyUsage,
  tryIncrementFeedbackUsage,
} from "@/lib/billing/usage";
import type { FeedbackSubmissionInput } from "@/lib/feedback/schema";
import {
  assertFeedbackHasContent,
  assertRatingsBelongToSelectedItems,
  FeedbackSubmitError,
} from "@/lib/feedback/validation";
import type { Json } from "@/lib/supabase/types";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export {
  assertFeedbackHasContent,
  assertRatingsBelongToSelectedItems,
  FeedbackSubmitError,
} from "@/lib/feedback/validation";

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values));
}

async function assertMenuItemsAreActive(input: FeedbackSubmissionInput) {
  const itemIds = uniqueValues(input.items.map((item) => item.id));
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("menu_items")
    .select("id")
    .eq("restaurant_id", input.restaurantId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("id", itemIds);

  if (error) {
    throw new Error(`Unable to verify feedback menu items: ${error.message}`);
  }

  const activeIds = new Set((data ?? []).map((item) => item.id));

  if (itemIds.some((id) => !activeIds.has(id))) {
    throw new FeedbackSubmitError(
      "invalid_menu_items",
      "Feedback contains inactive or unknown menu items.",
    );
  }
}

function entitlementBody(entitlement: EntitlementResult) {
  return {
    reason: entitlement.reason,
    used: entitlement.used,
    limit: entitlement.limit,
    remaining: entitlement.remaining,
    upgradeTarget: entitlement.upgradeTarget,
  };
}

async function deleteSession(sessionId: string) {
  const supabase = createSupabaseServiceClient();
  await supabase.from("feedback_sessions").delete().eq("id", sessionId);
}

export function responseForFeedbackSubmitError(error: FeedbackSubmitError) {
  if (error.entitlement) {
    return {
      status: 402,
      body: entitlementBody(error.entitlement),
    };
  }

  return {
    status: error.code === "empty_feedback" ? 400 : 422,
    body: {
      error: error.code,
      message: error.message,
    },
  };
}

export async function submitFeedback(input: FeedbackSubmissionInput) {
  assertFeedbackHasContent(input);
  assertRatingsBelongToSelectedItems(input);
  await assertMenuItemsAreActive(input);

  const [restaurant, currentUsage] = await Promise.all([
    (async () => {
      const supabase = createSupabaseServiceClient();
      const { data } = await supabase
        .from("restaurants")
        .select(
          "id, tier, subscription_status, current_period_ends_at, trial_ends_at",
        )
        .eq("id", input.restaurantId)
        .maybeSingle();
      return data;
    })(),
    getMonthlyUsage(input.restaurantId),
  ]);

  if (!restaurant) {
    throw new Error("Restaurant not found.");
  }

  const entitlement = getFeedbackEntitlement({
    restaurant,
    usage: currentUsage,
  });
  const period = getCurrentUsagePeriod();
  const newCount = await tryIncrementFeedbackUsage({
    restaurantId: input.restaurantId,
    period,
    limit: entitlement.limit,
  });

  if (newCount === null) {
    throw new FeedbackSubmitError(
      "feedback_limit_reached",
      "Feedback limit reached.",
      {
        ...entitlement,
        allowed: false,
        reason: "feedback_limit_reached",
      },
    );
  }

  const completedAt = new Date().toISOString();
  const supabase = createSupabaseServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from("feedback_sessions")
    .insert({
      restaurant_id: input.restaurantId,
      extracted_items: input.extractedItems as Json,
      customer_language: input.customerLanguage,
      overall_rating: input.overallRating ?? null,
      overall_comment: normalizeOptionalText(input.overallComment),
      completed_at: completedAt,
    })
    .select("id, restaurant_id, completed_at")
    .single();

  if (sessionError) {
    await supabase
      .from("usage_counters")
      .update({ feedback_count: newCount - 1 })
      .eq("restaurant_id", input.restaurantId)
      .eq("period", period)
      .then(({ error }) => {
        if (error) console.error("Failed to decrement feedback usage:", error);
      });

    throw new Error(
      `Unable to create feedback session: ${sessionError.message}`,
    );
  }

  const ratingRows = input.items
    .filter((item) => input.ratings[item.id] !== undefined)
    .map((item) => ({
      session_id: session.id,
      menu_item_id: item.id,
      rating: input.ratings[item.id],
      comment: normalizeOptionalText(input.comments[item.id]),
    }));

  if (ratingRows.length > 0) {
    const { error: ratingsError } = await supabase
      .from("feedback_ratings")
      .insert(ratingRows);

    if (ratingsError) {
      await deleteSession(session.id);
      await supabase
        .from("usage_counters")
        .update({ feedback_count: newCount - 1 })
        .eq("restaurant_id", input.restaurantId)
        .eq("period", period)
        .then(({ error }) => {
          if (error)
            console.error("Failed to decrement feedback usage:", error);
        });

      throw new Error(
        `Unable to create feedback ratings: ${ratingsError.message}`,
      );
    }
  }

  return {
    sessionId: session.id,
    completedAt: session.completed_at,
    usage: {
      used: newCount,
      limit: entitlement.limit,
      remaining: Math.max(0, entitlement.limit - newCount),
    },
  };
}
