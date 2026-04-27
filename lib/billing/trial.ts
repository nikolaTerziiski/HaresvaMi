import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

const TRIAL_DAYS = 14;
const TRIAL_SCAN_CREDITS = 100;
const MIN_ACTIVE_MENU_ITEMS_FOR_TRIAL = 5;

export type StartTrialErrorCode =
  | "restaurant_not_found"
  | "not_free_tier"
  | "trial_already_used"
  | "menu_incomplete";

export class StartTrialError extends Error {
  constructor(
    public readonly code: StartTrialErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "StartTrialError";
  }
}

export type TrialBillingState = {
  restaurant: {
    id: string;
    tier: string;
    subscription_status: string;
    current_period_ends_at: string | null;
    trial_started_at: string | null;
    trial_ends_at: string | null;
    trial_used_at: string | null;
  };
  scanCreditGrant: {
    id: string;
    source: string;
    credits_granted: number;
    credits_used: number;
    starts_at: string;
    expires_at: string | null;
  };
};

type RestaurantTrialRow = {
  id: string;
  owner_id: string;
  tier: string;
  subscription_status: string;
  current_period_ends_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  trial_used_at: string | null;
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function loadOwnerRestaurant(input: {
  restaurantId: string;
  ownerId: string;
}) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select(
      "id, owner_id, tier, subscription_status, current_period_ends_at, trial_started_at, trial_ends_at, trial_used_at",
    )
    .eq("id", input.restaurantId)
    .eq("owner_id", input.ownerId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load restaurant trial state: ${error.message}`);
  }

  return data as RestaurantTrialRow | null;
}

async function countActiveMenuItems(restaurantId: string) {
  const supabase = createSupabaseServiceClient();
  const { count, error } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .is("deleted_at", null);

  if (error) {
    throw new Error(`Unable to count active menu items: ${error.message}`);
  }

  return count ?? 0;
}

function assertCanStartTrial(
  restaurant: RestaurantTrialRow,
  activeMenuItemCount: number,
) {
  if (restaurant.tier !== "free") {
    throw new StartTrialError(
      "not_free_tier",
      "Restaurant must be on the free tier to start a trial.",
    );
  }

  if (restaurant.trial_started_at || restaurant.trial_used_at) {
    throw new StartTrialError(
      "trial_already_used",
      "Restaurant has already used its trial.",
    );
  }

  if (activeMenuItemCount < MIN_ACTIVE_MENU_ITEMS_FOR_TRIAL) {
    throw new StartTrialError(
      "menu_incomplete",
      "Restaurant needs at least 5 active menu items to start a trial.",
    );
  }
}

export async function startInternalTrial(input: {
  restaurantId: string;
  ownerId: string;
  now?: Date;
}): Promise<TrialBillingState> {
  const restaurant = await loadOwnerRestaurant(input);

  if (!restaurant) {
    throw new StartTrialError(
      "restaurant_not_found",
      "Restaurant was not found for this owner.",
    );
  }

  const activeMenuItemCount = await countActiveMenuItems(restaurant.id);
  assertCanStartTrial(restaurant, activeMenuItemCount);

  const now = input.now ?? new Date();
  const trialStartedAt = now.toISOString();
  const trialEndsAt = addDays(now, TRIAL_DAYS).toISOString();
  const supabase = createSupabaseServiceClient();

  const { data: updatedRestaurant, error: updateError } = await supabase
    .from("restaurants")
    .update({
      tier: "pro",
      subscription_status: "trialing",
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
      trial_used_at: trialStartedAt,
    })
    .eq("id", restaurant.id)
    .eq("owner_id", input.ownerId)
    .eq("tier", "free")
    .is("trial_started_at", null)
    .is("trial_used_at", null)
    .select(
      "id, tier, subscription_status, current_period_ends_at, trial_started_at, trial_ends_at, trial_used_at",
    )
    .maybeSingle();

  if (updateError) {
    throw new Error(`Unable to start trial: ${updateError.message}`);
  }

  if (!updatedRestaurant) {
    throw new StartTrialError(
      "trial_already_used",
      "Restaurant trial state changed before activation completed.",
    );
  }

  const { data: scanCreditGrant, error: grantError } = await supabase
    .from("scan_credit_grants")
    .insert({
      restaurant_id: restaurant.id,
      source: "trial",
      credits_granted: TRIAL_SCAN_CREDITS,
      credits_used: 0,
      starts_at: trialStartedAt,
      expires_at: trialEndsAt,
    })
    .select("id, source, credits_granted, credits_used, starts_at, expires_at")
    .single();

  if (grantError) {
    throw new Error(
      `Unable to create trial scan credits: ${grantError.message}`,
    );
  }

  return {
    restaurant: updatedRestaurant,
    scanCreditGrant,
  } as TrialBillingState;
}

export function statusForStartTrialError(error: StartTrialError) {
  if (error.code === "restaurant_not_found") return 404;
  if (error.code === "menu_incomplete") return 422;
  return 409;
}
