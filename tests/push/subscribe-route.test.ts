import assert from "node:assert/strict";
import test from "node:test";

import {
  pushSubscribeSchema,
  pushUnsubscribeSchema,
} from "@/lib/validations/push";

// ---------------------------------------------------------------------------
// Validation tests for the push subscribe schemas (no HTTP calls needed).
// ---------------------------------------------------------------------------

test("subscribe schema rejects missing endpoint", () => {
  const result = pushSubscribeSchema.safeParse({
    keys: { p256dh: "abc", auth: "def" },
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path[0]);
    assert.ok(paths.includes("endpoint"), "should fail on endpoint");
  }
});

test("subscribe schema rejects missing keys", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://example.com/push/123",
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path[0]);
    assert.ok(paths.includes("keys"), "should fail on keys");
  }
});

test("subscribe schema rejects invalid endpoint URL", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "not-a-url",
    keys: { p256dh: "abc", auth: "def" },
  });
  assert.equal(result.success, false);
});

test("subscribe schema rejects empty p256dh", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://example.com/push/123",
    keys: { p256dh: "", auth: "def" },
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    assert.ok(
      paths.some((p) => p.includes("p256dh")),
      "should fail on keys.p256dh",
    );
  }
});

test("subscribe schema rejects empty auth", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://example.com/push/123",
    keys: { p256dh: "abc", auth: "" },
  });
  assert.equal(result.success, false);
  if (!result.success) {
    const paths = result.error.issues.map((i) => i.path.join("."));
    assert.ok(
      paths.some((p) => p.includes("auth")),
      "should fail on keys.auth",
    );
  }
});

test("subscribe schema accepts valid payload with optional fields omitted", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://updates.push.services.mozilla.com/push/v1/abc",
    keys: { p256dh: "BNbP_ABC", auth: "xyz123" },
  });
  assert.equal(result.success, true);
});

test("subscribe schema accepts payload with expirationTime null", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://fcm.googleapis.com/fcm/send/abc:def",
    keys: { p256dh: "BNbP_ABC", auth: "xyz123" },
    expirationTime: null,
  });
  assert.equal(result.success, true);
});

test("subscribe schema accepts payload with userAgent", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://fcm.googleapis.com/fcm/send/abc:def",
    keys: { p256dh: "BNbP_ABC", auth: "xyz123" },
    userAgent: "Mozilla/5.0",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.userAgent, "Mozilla/5.0");
  }
});

test("subscribe schema rejects userAgent over 500 chars", () => {
  const result = pushSubscribeSchema.safeParse({
    endpoint: "https://fcm.googleapis.com/fcm/send/abc:def",
    keys: { p256dh: "BNbP_ABC", auth: "xyz123" },
    userAgent: "A".repeat(501),
  });
  assert.equal(result.success, false);
});

test("unsubscribe schema rejects missing endpoint", () => {
  const result = pushUnsubscribeSchema.safeParse({});
  assert.equal(result.success, false);
});

test("unsubscribe schema rejects non-URL endpoint", () => {
  const result = pushUnsubscribeSchema.safeParse({ endpoint: "not-a-url" });
  assert.equal(result.success, false);
});

test("unsubscribe schema accepts valid endpoint", () => {
  const result = pushUnsubscribeSchema.safeParse({
    endpoint: "https://example.com/push/abc",
  });
  assert.equal(result.success, true);
});
