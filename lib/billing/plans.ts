export const PLAN_TIERS = ["free", "starter", "pro"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];

export type PlanLimits = {
  feedbackPerMonth: number;
  aiScansPerMonth: number;
};

export type PlanDefinition = PlanLimits & {
  tier: PlanTier;
};

export const PLAN_LIMITS = {
  free: {
    tier: "free",
    feedbackPerMonth: 50,
    aiScansPerMonth: 5,
  },
  starter: {
    tier: "starter",
    feedbackPerMonth: 500,
    aiScansPerMonth: 150,
  },
  pro: {
    tier: "pro",
    feedbackPerMonth: 10000,
    aiScansPerMonth: 1000,
  },
} as const satisfies Record<PlanTier, PlanDefinition>;

export function isPlanTier(value: string): value is PlanTier {
  return PLAN_TIERS.includes(value as PlanTier);
}

export function getPlanLimits(tier: PlanTier): PlanLimits {
  const { feedbackPerMonth, aiScansPerMonth } = PLAN_LIMITS[tier];

  return {
    feedbackPerMonth,
    aiScansPerMonth,
  };
}

export function getFeedbackLimit(tier: PlanTier): number {
  return PLAN_LIMITS[tier].feedbackPerMonth;
}

export function getAiScanLimit(tier: PlanTier): number {
  return PLAN_LIMITS[tier].aiScansPerMonth;
}
