import {
  getAiScanLimit,
  getFeedbackLimit,
  isPlanTier,
  type PlanTier,
} from "@/lib/billing/plans";

export type RestaurantEntitlementState = {
  id: string;
  tier: string;
  subscription_status: string;
  current_period_ends_at: string | null;
  trial_ends_at: string | null;
};

export type MonthlyUsageSnapshot = {
  feedbackCount: number;
  aiScanCount: number;
};

export type ScanCreditSnapshot = {
  granted: number;
  used: number;
  remaining: number;
};

export type EntitlementReason =
  | "allowed"
  | "restaurant_not_found"
  | "subscription_inactive"
  | "trial_expired"
  | "feedback_limit_reached"
  | "scan_limit_reached"
  | "scan_credit_unavailable";

export type EntitlementResult = {
  allowed: boolean;
  reason: EntitlementReason;
  limit: number;
  used: number;
  remaining: number;
  upgradeTarget: PlanTier | null;
};

export type PlanAccess = {
  tier: PlanTier;
  paidTierInactive: boolean;
  trialActive: boolean;
  trialExpired: boolean;
};

export function emptyEntitlementResult(
  reason: EntitlementReason,
): EntitlementResult {
  return {
    allowed: false,
    reason,
    limit: 0,
    used: 0,
    remaining: 0,
    upgradeTarget: null,
  };
}

export function isFuture(value: string | null, now: Date) {
  return value ? new Date(value).getTime() > now.getTime() : false;
}

export function normalizeTier(tier: string): PlanTier {
  return isPlanTier(tier) ? tier : "free";
}

export function nextUpgradeTarget(tier: PlanTier): PlanTier | null {
  if (tier === "free") return "starter";
  if (tier === "starter") return "pro";
  return null;
}

export function hasPaidAccess(
  restaurant: RestaurantEntitlementState,
  now: Date,
) {
  if (restaurant.subscription_status === "active") {
    return true;
  }

  if (restaurant.subscription_status === "trialing") {
    return isFuture(restaurant.trial_ends_at, now);
  }

  if (restaurant.subscription_status === "past_due") {
    return isFuture(restaurant.current_period_ends_at, now);
  }

  return false;
}

export function resolvePlanAccess(
  restaurant: RestaurantEntitlementState,
  now = new Date(),
): PlanAccess {
  const configuredTier = normalizeTier(restaurant.tier);
  const trialActive =
    restaurant.subscription_status === "trialing" &&
    isFuture(restaurant.trial_ends_at, now);

  if (configuredTier === "free") {
    return {
      tier: "free",
      paidTierInactive: false,
      trialActive,
      trialExpired: false,
    };
  }

  const paidAccess = hasPaidAccess(restaurant, now);

  if (paidAccess) {
    return {
      tier: configuredTier,
      paidTierInactive: false,
      trialActive,
      trialExpired: false,
    };
  }

  return {
    tier: "free",
    paidTierInactive: true,
    trialActive: false,
    trialExpired:
      restaurant.subscription_status === "trialing" &&
      Boolean(restaurant.trial_ends_at) &&
      !isFuture(restaurant.trial_ends_at, now),
  };
}

export function resultForLimit(params: {
  used: number;
  limit: number;
  tier: PlanTier;
  paidTierInactive: boolean;
  trialExpired: boolean;
  limitReason: EntitlementReason;
}): EntitlementResult {
  const remaining = Math.max(0, params.limit - params.used);

  if (params.used < params.limit) {
    return {
      allowed: true,
      reason: "allowed",
      limit: params.limit,
      used: params.used,
      remaining,
      upgradeTarget: null,
    };
  }

  return {
    allowed: false,
    reason: params.trialExpired
      ? "trial_expired"
      : params.paidTierInactive
        ? "subscription_inactive"
        : params.limitReason,
    limit: params.limit,
    used: params.used,
    remaining,
    upgradeTarget: nextUpgradeTarget(params.tier),
  };
}

export function getFeedbackEntitlement(input: {
  restaurant: RestaurantEntitlementState;
  usage: MonthlyUsageSnapshot;
  now?: Date;
}): EntitlementResult {
  const plan = resolvePlanAccess(input.restaurant, input.now);
  const limit = getFeedbackLimit(plan.tier);

  return resultForLimit({
    used: input.usage.feedbackCount,
    limit,
    tier: plan.tier,
    paidTierInactive: plan.paidTierInactive,
    trialExpired: plan.trialExpired,
    limitReason: "feedback_limit_reached",
  });
}

export function getScanEntitlement(input: {
  restaurant: RestaurantEntitlementState;
  usage: MonthlyUsageSnapshot;
  creditSummary: ScanCreditSnapshot;
  now?: Date;
}): EntitlementResult {
  const plan = resolvePlanAccess(input.restaurant, input.now);

  if (plan.trialActive) {
    if (input.creditSummary.remaining > 0) {
      return {
        allowed: true,
        reason: "allowed",
        limit: input.creditSummary.granted,
        used: input.creditSummary.used,
        remaining: input.creditSummary.remaining,
        upgradeTarget: null,
      };
    }

    return {
      allowed: false,
      reason: "scan_limit_reached",
      limit: input.creditSummary.granted,
      used: input.creditSummary.used,
      remaining: 0,
      upgradeTarget: "pro",
    };
  }

  const planLimit = getAiScanLimit(plan.tier);
  const planRemaining = Math.max(0, planLimit - input.usage.aiScanCount);
  const extraUsedBeyondPlan = Math.max(0, input.usage.aiScanCount - planLimit);
  const limit = planLimit + extraUsedBeyondPlan + input.creditSummary.remaining;
  const remaining = planRemaining + input.creditSummary.remaining;

  if (remaining > 0) {
    return {
      allowed: true,
      reason: "allowed",
      limit,
      used: input.usage.aiScanCount,
      remaining,
      upgradeTarget: null,
    };
  }

  return {
    allowed: false,
    reason: plan.trialExpired
      ? "trial_expired"
      : plan.paidTierInactive
        ? "subscription_inactive"
        : "scan_limit_reached",
    limit,
    used: input.usage.aiScanCount,
    remaining: 0,
    upgradeTarget: nextUpgradeTarget(plan.tier),
  };
}

export function shouldConsumeScanCreditGrant(input: {
  restaurant: RestaurantEntitlementState;
  usage: MonthlyUsageSnapshot;
  now?: Date;
}) {
  const plan = resolvePlanAccess(input.restaurant, input.now);

  if (plan.trialActive) {
    return true;
  }

  return input.usage.aiScanCount >= getAiScanLimit(plan.tier);
}

export function applySuccessfulEntitlementConsumption(
  entitlement: EntitlementResult,
): EntitlementResult {
  return {
    ...entitlement,
    allowed: true,
    reason: "allowed",
    used: entitlement.used + 1,
    remaining: Math.max(0, entitlement.remaining - 1),
  };
}
