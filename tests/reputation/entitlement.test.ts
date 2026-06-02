import assert from "node:assert/strict";
import test from "node:test";

import { restaurantHasReputationAccess } from "@/lib/reputation/entitlement";

const FUTURE = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

test("free plan → no reputation access", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "free",
      subscription_status: "none",
      trial_ends_at: null,
    }),
    false,
  );
});

test("active Pro subscription → has reputation access", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "active",
      trial_ends_at: null,
    }),
    true,
  );
});

test("active trial (any tier) → has reputation access", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "trialing",
      trial_ends_at: FUTURE,
    }),
    true,
  );
});

test("trial with free tier but future trial_ends_at → has reputation access", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "free",
      subscription_status: "trialing",
      trial_ends_at: FUTURE,
    }),
    true,
  );
});

test("canceled Pro subscription → no reputation access", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "canceled",
      trial_ends_at: null,
    }),
    false,
  );
});

test("past_due Pro subscription → no reputation access (past_due not in allowed set)", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "past_due",
      trial_ends_at: null,
    }),
    false,
  );
});

test("expired trial (status updated to canceled after expiry) → no reputation access", () => {
  // Once the trial webhook fires, Stripe updates subscription_status to canceled.
  // hasProAccess only returns false when the subscription is no longer active/trialing.
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "canceled",
      trial_ends_at: PAST,
    }),
    false,
  );
});

test("trialing status with future trial_ends_at → has reputation access", () => {
  // Active trial: both status is trialing AND trial_ends_at is in the future
  assert.equal(
    restaurantHasReputationAccess({
      tier: "pro",
      subscription_status: "trialing",
      trial_ends_at: FUTURE,
    }),
    true,
  );
});

test("starter plan active → no reputation access (Pro only)", () => {
  assert.equal(
    restaurantHasReputationAccess({
      tier: "starter",
      subscription_status: "active",
      trial_ends_at: null,
    }),
    false,
  );
});
