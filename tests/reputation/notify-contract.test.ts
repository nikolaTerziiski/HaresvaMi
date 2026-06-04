import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const notifySource = source("lib/reputation/notify.ts");
const payloadSource = source("lib/push/payload.ts");

// ── lib/reputation/notify.ts ─────────────────────────────────────────────────

test("notify.ts references sendPush", () => {
  assert.match(notifySource, /sendPush/);
});

test("notify.ts references push_subscriptions table", () => {
  assert.match(notifySource, /push_subscriptions/);
});

// ── lib/push/payload.ts ──────────────────────────────────────────────────────

test("payload.ts exports buildLowRatingPushPayload", () => {
  assert.match(payloadSource, /export function buildLowRatingPushPayload/);
});

test("buildLowRatingPushPayload url is /dashboard/feedback", () => {
  const { buildLowRatingPushPayload } = require("@/lib/push/payload");
  const payload = buildLowRatingPushPayload("Ресторант Тест");
  assert.equal(payload.url, "/dashboard/feedback");
});

test("buildLowRatingPushPayload contains no PII: no comment interpolation", () => {
  // The source must not interpolate a `comment` or `email` variable into the body
  assert.doesNotMatch(payloadSource, /\$\{.*comment.*\}/);
  assert.doesNotMatch(payloadSource, /\$\{.*email.*\}/);
});

test("buildLowRatingPushPayload contains no PII: no customer name interpolation", () => {
  // Only the restaurant name argument may appear in the payload body
  assert.doesNotMatch(payloadSource, /customerName/);
  assert.doesNotMatch(payloadSource, /customer_name/);
});
