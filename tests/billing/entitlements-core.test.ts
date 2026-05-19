import assert from "node:assert/strict";
import test from "node:test";

import {
  applySuccessfulEntitlementConsumption,
  FREE_MENU_EXTRACTION_LIMIT,
  getFeedbackEntitlement,
  getMenuExtractionEntitlement,
  getScanEntitlement,
  nextUpgradeTarget,
  PRO_MENU_EXTRACTION_LIMIT,
  shouldConsumeScanCreditGrant,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import {
  getAiScanLimit,
  getFeedbackLimit,
  getPlanLimits,
  type PlanTier,
} from "@/lib/billing/plans";

const now = new Date("2026-04-25T12:00:00.000Z");

const emptyCredits = {
  granted: 0,
  used: 0,
  remaining: 0,
};

const tierCases = [
  {
    tier: "free",
    feedbackLimit: 50,
    scanLimit: 5,
    upgradeTarget: "starter",
  },
  {
    tier: "starter",
    feedbackLimit: 500,
    scanLimit: 150,
    upgradeTarget: "pro",
  },
  {
    tier: "pro",
    feedbackLimit: 10000,
    scanLimit: 1000,
    upgradeTarget: null,
  },
] satisfies Array<{
  tier: PlanTier;
  feedbackLimit: number;
  scanLimit: number;
  upgradeTarget: PlanTier | null;
}>;

function restaurant(
  tier: PlanTier,
  overrides: Partial<RestaurantEntitlementState> = {},
): RestaurantEntitlementState {
  const paidTier = tier !== "free";

  return {
    id: `restaurant-${tier}`,
    tier,
    subscription_status: paidTier ? "active" : "none",
    current_period_ends_at: paidTier ? "2026-05-25T12:00:00.000Z" : null,
    trial_ends_at: null,
    ...overrides,
  };
}

function usage(feedbackCount = 0, aiScanCount = 0, menuExtractionCount = 0) {
  return {
    feedbackCount,
    aiScanCount,
    menuExtractionCount,
  };
}

test("plan limits are explicit for Free, Starter, and Pro", () => {
  for (const { tier, feedbackLimit, scanLimit } of tierCases) {
    assert.deepEqual(getPlanLimits(tier), {
      feedbackPerMonth: feedbackLimit,
      aiScansPerMonth: scanLimit,
    });
    assert.equal(getFeedbackLimit(tier), feedbackLimit);
    assert.equal(getAiScanLimit(tier), scanLimit);
  }
});

for (const { tier, scanLimit, upgradeTarget } of tierCases) {
  test(`${tier} scan entitlement allows scan ${scanLimit} and blocks scan ${
    scanLimit + 1
  }`, () => {
    const targetRestaurant = restaurant(tier);
    const allowed = getScanEntitlement({
      restaurant: targetRestaurant,
      usage: usage(0, scanLimit - 1),
      creditSummary: emptyCredits,
      now,
    });
    const blocked = getScanEntitlement({
      restaurant: targetRestaurant,
      usage: usage(0, scanLimit),
      creditSummary: emptyCredits,
      now,
    });

    assert.equal(allowed.allowed, true);
    assert.equal(allowed.reason, "allowed");
    assert.equal(allowed.limit, scanLimit);
    assert.equal(allowed.used, scanLimit - 1);
    assert.equal(allowed.remaining, 1);

    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "scan_limit_reached");
    assert.equal(blocked.limit, scanLimit);
    assert.equal(blocked.used, scanLimit);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.upgradeTarget, upgradeTarget);
  });
}

for (const { tier, feedbackLimit, upgradeTarget } of tierCases) {
  test(`${tier} feedback entitlement allows response ${feedbackLimit} and blocks response ${
    feedbackLimit + 1
  }`, () => {
    const targetRestaurant = restaurant(tier);
    const allowed = getFeedbackEntitlement({
      restaurant: targetRestaurant,
      usage: usage(feedbackLimit - 1),
      now,
    });
    const blocked = getFeedbackEntitlement({
      restaurant: targetRestaurant,
      usage: usage(feedbackLimit),
      now,
    });

    assert.equal(allowed.allowed, true);
    assert.equal(allowed.reason, "allowed");
    assert.equal(allowed.limit, feedbackLimit);
    assert.equal(allowed.used, feedbackLimit - 1);
    assert.equal(allowed.remaining, 1);

    assert.equal(blocked.allowed, false);
    assert.equal(blocked.reason, "feedback_limit_reached");
    assert.equal(blocked.limit, feedbackLimit);
    assert.equal(blocked.used, feedbackLimit);
    assert.equal(blocked.remaining, 0);
    assert.equal(blocked.upgradeTarget, upgradeTarget);
  });
}

test("upgrade targets progress Free to Starter to Pro", () => {
  assert.equal(nextUpgradeTarget("free"), "starter");
  assert.equal(nextUpgradeTarget("starter"), "pro");
  assert.equal(nextUpgradeTarget("pro"), null);
});

for (const tier of ["starter", "pro"] satisfies PlanTier[]) {
  test(`inactive ${tier} subscription falls back to Free effective limits`, () => {
    const inactivePaidRestaurant = restaurant(tier, {
      subscription_status: "canceled",
      current_period_ends_at: null,
    });
    const scanAllowed = getScanEntitlement({
      restaurant: inactivePaidRestaurant,
      usage: usage(0, 4),
      creditSummary: emptyCredits,
      now,
    });
    const scanBlocked = getScanEntitlement({
      restaurant: inactivePaidRestaurant,
      usage: usage(0, 5),
      creditSummary: emptyCredits,
      now,
    });
    const feedbackAllowed = getFeedbackEntitlement({
      restaurant: inactivePaidRestaurant,
      usage: usage(49),
      now,
    });
    const feedbackBlocked = getFeedbackEntitlement({
      restaurant: inactivePaidRestaurant,
      usage: usage(50),
      now,
    });

    assert.equal(scanAllowed.allowed, true);
    assert.equal(scanAllowed.limit, 5);
    assert.equal(scanAllowed.remaining, 1);
    assert.equal(scanBlocked.allowed, false);
    assert.equal(scanBlocked.reason, "subscription_inactive");
    assert.equal(scanBlocked.limit, 5);
    assert.equal(scanBlocked.upgradeTarget, "starter");

    assert.equal(feedbackAllowed.allowed, true);
    assert.equal(feedbackAllowed.limit, 50);
    assert.equal(feedbackAllowed.remaining, 1);
    assert.equal(feedbackBlocked.allowed, false);
    assert.equal(feedbackBlocked.reason, "subscription_inactive");
    assert.equal(feedbackBlocked.limit, 50);
    assert.equal(feedbackBlocked.upgradeTarget, "starter");
  });
}

test("trial grants 100 scan credits", () => {
  const trialRestaurant = restaurant("pro", {
    subscription_status: "trialing",
    current_period_ends_at: null,
    trial_ends_at: "2026-05-09T12:00:00.000Z",
  });

  const entitlement = getScanEntitlement({
    restaurant: trialRestaurant,
    usage: usage(),
    creditSummary: {
      granted: 100,
      used: 0,
      remaining: 100,
    },
    now,
  });

  assert.equal(entitlement.allowed, true);
  assert.equal(entitlement.limit, 100);
  assert.equal(entitlement.used, 0);
  assert.equal(entitlement.remaining, 100);
  assert.equal(
    shouldConsumeScanCreditGrant({
      restaurant: trialRestaurant,
      usage: usage(),
      now,
    }),
    true,
  );
});

test("expired trial returns trial_expired once Free fallback limits are exhausted", () => {
  const expiredTrialRestaurant = restaurant("pro", {
    subscription_status: "trialing",
    current_period_ends_at: null,
    trial_ends_at: "2026-04-20T12:00:00.000Z",
  });

  const scanAllowed = getScanEntitlement({
    restaurant: expiredTrialRestaurant,
    usage: usage(0, 4),
    creditSummary: emptyCredits,
    now,
  });
  const scanBlocked = getScanEntitlement({
    restaurant: expiredTrialRestaurant,
    usage: usage(0, 5),
    creditSummary: emptyCredits,
    now,
  });
  const feedbackAllowed = getFeedbackEntitlement({
    restaurant: expiredTrialRestaurant,
    usage: usage(49),
    now,
  });
  const feedbackBlocked = getFeedbackEntitlement({
    restaurant: expiredTrialRestaurant,
    usage: usage(50),
    now,
  });

  assert.equal(scanAllowed.allowed, true);
  assert.equal(scanAllowed.limit, 5);
  assert.equal(scanBlocked.allowed, false);
  assert.equal(scanBlocked.reason, "trial_expired");
  assert.equal(scanBlocked.limit, 5);

  assert.equal(feedbackAllowed.allowed, true);
  assert.equal(feedbackAllowed.limit, 50);
  assert.equal(feedbackBlocked.allowed, false);
  assert.equal(feedbackBlocked.reason, "trial_expired");
  assert.equal(feedbackBlocked.limit, 50);
});

test("AI scan usage changes only after successful extraction", () => {
  const beforeExtraction = getScanEntitlement({
    restaurant: restaurant("free"),
    usage: usage(0, 2),
    creditSummary: emptyCredits,
    now,
  });
  const afterFailure = { ...beforeExtraction };
  const afterSuccess = applySuccessfulEntitlementConsumption(beforeExtraction);

  assert.deepEqual(afterFailure, beforeExtraction);
  assert.equal(afterSuccess.used, beforeExtraction.used + 1);
  assert.equal(afterSuccess.remaining, beforeExtraction.remaining - 1);
});

test("free plan allows 1 menu extraction and blocks the second", () => {
  const freeRestaurant = restaurant("free");

  const allowed = getMenuExtractionEntitlement({
    restaurant: freeRestaurant,
    usage: usage(0, 0, 0),
    now,
  });
  const blocked = getMenuExtractionEntitlement({
    restaurant: freeRestaurant,
    usage: usage(0, 0, FREE_MENU_EXTRACTION_LIMIT),
    now,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.limit, FREE_MENU_EXTRACTION_LIMIT);
  assert.equal(allowed.remaining, FREE_MENU_EXTRACTION_LIMIT);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "menu_extraction_limit_reached");
  assert.equal(blocked.limit, FREE_MENU_EXTRACTION_LIMIT);
  assert.equal(blocked.remaining, 0);
  assert.equal(blocked.upgradeTarget, "starter");
});

test("pro plan allows 10 menu extractions and blocks the eleventh", () => {
  const proRestaurant = restaurant("pro");

  const allowed = getMenuExtractionEntitlement({
    restaurant: proRestaurant,
    usage: usage(0, 0, PRO_MENU_EXTRACTION_LIMIT - 1),
    now,
  });
  const blocked = getMenuExtractionEntitlement({
    restaurant: proRestaurant,
    usage: usage(0, 0, PRO_MENU_EXTRACTION_LIMIT),
    now,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.limit, PRO_MENU_EXTRACTION_LIMIT);
  assert.equal(allowed.remaining, 1);

  assert.equal(blocked.allowed, false);
  assert.equal(blocked.reason, "menu_extraction_limit_reached");
  assert.equal(blocked.upgradeTarget, null);
});

test("active trial counts as pro for menu extraction limit", () => {
  const trialRestaurant = restaurant("pro", {
    subscription_status: "trialing",
    trial_ends_at: "2026-05-09T12:00:00.000Z",
  });

  const allowed = getMenuExtractionEntitlement({
    restaurant: trialRestaurant,
    usage: usage(0, 0, PRO_MENU_EXTRACTION_LIMIT - 1),
    now,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.limit, PRO_MENU_EXTRACTION_LIMIT);
});
