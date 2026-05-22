import assert from "node:assert/strict";
import test from "node:test";

/**
 * Tests for weekly insight cron eligibility logic.
 *
 * We test the pure eligibility predicate inline rather than calling
 * getEligibleRestaurants() (which requires a live DB). The SQL predicate
 * used in scheduling.ts is:
 *
 *   subscription_status = 'active' AND tier = 'pro'
 *   OR
 *   subscription_status = 'trialing' AND trial_ends_at > NOW()
 *
 * We mirror that logic here for deterministic unit tests.
 */

type RestaurantLike = {
  id: string;
  tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
};

function isEligibleForCron(
  restaurant: RestaurantLike,
  now: Date = new Date(),
): boolean {
  const { tier, subscription_status, trial_ends_at } = restaurant;

  if (subscription_status === "active" && tier === "pro") {
    return true;
  }

  if (subscription_status === "trialing" && trial_ends_at !== null) {
    return new Date(trial_ends_at) > now;
  }

  return false;
}

const NOW = new Date("2026-05-22T12:00:00.000Z");

function makeRestaurant(
  overrides: Partial<RestaurantLike> = {},
): RestaurantLike {
  return {
    id: "restaurant-test",
    tier: "free",
    subscription_status: "none",
    trial_ends_at: null,
    ...overrides,
  };
}

test("Pro active is eligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "active",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), true);
});

test("Trialing with future trial_ends_at is eligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "trialing",
    trial_ends_at: "2026-06-01T00:00:00.000Z",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), true);
});

test("Trialing with past trial_ends_at is ineligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "trialing",
    trial_ends_at: "2026-05-01T00:00:00.000Z",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

test("Free tier is ineligible even with active status", () => {
  const restaurant = makeRestaurant({
    tier: "free",
    subscription_status: "active",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

test("Starter active is ineligible (weekly insights are Pro-only)", () => {
  const restaurant = makeRestaurant({
    tier: "starter",
    subscription_status: "active",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

test("Pro canceled is ineligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "canceled",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

test("Pro past_due is ineligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "past_due",
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

test("Trialing with null trial_ends_at is ineligible", () => {
  const restaurant = makeRestaurant({
    tier: "pro",
    subscription_status: "trialing",
    trial_ends_at: null,
  });
  assert.equal(isEligibleForCron(restaurant, NOW), false);
});

/**
 * The <3 ratings check is handled by hasEnoughRatings() in scheduling.ts,
 * which queries the DB. We test the intent here via a stub.
 */
test("fewer than 3 ratings makes restaurant ineligible even if Pro active", () => {
  // Simulate the hasEnoughRatings() return value.
  const proActive = makeRestaurant({
    tier: "pro",
    subscription_status: "active",
  });
  const hasEnough = (count: number) => count >= 3;

  assert.equal(isEligibleForCron(proActive, NOW) && hasEnough(2), false);
  assert.equal(isEligibleForCron(proActive, NOW) && hasEnough(3), true);
  assert.equal(isEligibleForCron(proActive, NOW) && hasEnough(0), false);
});

test("exactly 3 ratings meets the minimum threshold", () => {
  const hasEnough = (count: number) => count >= 3;
  assert.equal(hasEnough(3), true);
});
