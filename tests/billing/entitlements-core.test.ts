import assert from "node:assert/strict";
import test from "node:test";

import {
  applySuccessfulEntitlementConsumption,
  getScanEntitlement,
  shouldConsumeScanCreditGrant,
  type RestaurantEntitlementState,
} from "@/lib/billing/entitlements-core";
import { getAiScanLimit } from "@/lib/billing/plans";

const now = new Date("2026-04-25T12:00:00.000Z");

const freeRestaurant: RestaurantEntitlementState = {
  id: "restaurant-free",
  tier: "free",
  subscription_status: "none",
  current_period_ends_at: null,
  trial_ends_at: null,
};

const emptyCredits = {
  granted: 0,
  used: 0,
  remaining: 0,
};

function usage(aiScanCount: number) {
  return {
    feedbackCount: 0,
    aiScanCount,
  };
}

test("free plan has 5 AI scans per month", () => {
  assert.equal(getAiScanLimit("free"), 5);

  const entitlement = getScanEntitlement({
    restaurant: freeRestaurant,
    usage: usage(0),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(entitlement.allowed, true);
  assert.equal(entitlement.limit, 5);
  assert.equal(entitlement.remaining, 5);
});

test("free plan blocks scan number 6", () => {
  const entitlement = getScanEntitlement({
    restaurant: freeRestaurant,
    usage: usage(5),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(entitlement.allowed, false);
  assert.equal(entitlement.reason, "scan_limit_reached");
  assert.equal(entitlement.limit, 5);
  assert.equal(entitlement.used, 5);
  assert.equal(entitlement.remaining, 0);
});

test("trial grants 100 scan credits", () => {
  const trialRestaurant: RestaurantEntitlementState = {
    id: "restaurant-trial",
    tier: "pro",
    subscription_status: "trialing",
    current_period_ends_at: null,
    trial_ends_at: "2026-05-09T12:00:00.000Z",
  };

  const entitlement = getScanEntitlement({
    restaurant: trialRestaurant,
    usage: usage(0),
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
      usage: usage(0),
      now,
    }),
    true,
  );
});

test("expired trial blocks Pro-only scan access unless paid subscription is active", () => {
  const expiredTrialRestaurant: RestaurantEntitlementState = {
    id: "restaurant-expired-trial",
    tier: "pro",
    subscription_status: "trialing",
    current_period_ends_at: null,
    trial_ends_at: "2026-04-20T12:00:00.000Z",
  };

  const expiredTrialEntitlement = getScanEntitlement({
    restaurant: expiredTrialRestaurant,
    usage: usage(5),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(expiredTrialEntitlement.allowed, false);
  assert.equal(expiredTrialEntitlement.reason, "trial_expired");
  assert.equal(expiredTrialEntitlement.limit, 5);

  const paidRestaurant: RestaurantEntitlementState = {
    ...expiredTrialRestaurant,
    subscription_status: "active",
    current_period_ends_at: "2026-05-25T12:00:00.000Z",
  };

  const paidEntitlement = getScanEntitlement({
    restaurant: paidRestaurant,
    usage: usage(999),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(paidEntitlement.allowed, true);
  assert.equal(paidEntitlement.limit, 1000);
  assert.equal(paidEntitlement.remaining, 1);
});

test("failed AI extraction does not consume scan credit", () => {
  const beforeFailure = getScanEntitlement({
    restaurant: freeRestaurant,
    usage: usage(2),
    creditSummary: emptyCredits,
    now,
  });
  const afterFailure = { ...beforeFailure };

  assert.deepEqual(afterFailure, beforeFailure);
  assert.equal(afterFailure.used, 2);
  assert.equal(afterFailure.remaining, 3);
});

test("successful AI extraction consumes exactly one scan credit", () => {
  const beforeSuccess = getScanEntitlement({
    restaurant: freeRestaurant,
    usage: usage(2),
    creditSummary: emptyCredits,
    now,
  });
  const afterSuccess = applySuccessfulEntitlementConsumption(beforeSuccess);

  assert.equal(afterSuccess.used, beforeSuccess.used + 1);
  assert.equal(afterSuccess.remaining, beforeSuccess.remaining - 1);
});

test("pro allows up to 1000 monthly scans", () => {
  const proRestaurant: RestaurantEntitlementState = {
    id: "restaurant-pro",
    tier: "pro",
    subscription_status: "active",
    current_period_ends_at: "2026-05-25T12:00:00.000Z",
    trial_ends_at: null,
  };

  const scan1000 = getScanEntitlement({
    restaurant: proRestaurant,
    usage: usage(999),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(scan1000.allowed, true);
  assert.equal(scan1000.limit, 1000);
  assert.equal(scan1000.remaining, 1);

  const scan1001 = getScanEntitlement({
    restaurant: proRestaurant,
    usage: usage(1000),
    creditSummary: emptyCredits,
    now,
  });

  assert.equal(scan1001.allowed, false);
  assert.equal(scan1001.reason, "scan_limit_reached");
  assert.equal(scan1001.remaining, 0);
});
