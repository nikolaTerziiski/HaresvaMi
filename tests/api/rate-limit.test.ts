import assert from "node:assert/strict";
import test from "node:test";

import {
  checkRateLimit,
  resetRateLimitBuckets,
} from "@/lib/api/rate-limit";

test("rate limiter blocks requests after the configured window limit", () => {
  resetRateLimitBuckets();

  const first = checkRateLimit({
    key: "extract-receipt:test",
    limit: 2,
    windowMs: 60_000,
    now: 1_000,
  });
  const second = checkRateLimit({
    key: "extract-receipt:test",
    limit: 2,
    windowMs: 60_000,
    now: 2_000,
  });
  const third = checkRateLimit({
    key: "extract-receipt:test",
    limit: 2,
    windowMs: 60_000,
    now: 3_000,
  });

  assert.equal(first.allowed, true);
  assert.equal(second.allowed, true);
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);
});

test("rate limiter resets after the window expires", () => {
  resetRateLimitBuckets();

  checkRateLimit({
    key: "extract-receipt:reset",
    limit: 1,
    windowMs: 60_000,
    now: 1_000,
  });

  const blocked = checkRateLimit({
    key: "extract-receipt:reset",
    limit: 1,
    windowMs: 60_000,
    now: 2_000,
  });
  const reset = checkRateLimit({
    key: "extract-receipt:reset",
    limit: 1,
    windowMs: 60_000,
    now: 62_000,
  });

  assert.equal(blocked.allowed, false);
  assert.equal(reset.allowed, true);
});
