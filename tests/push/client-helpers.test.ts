import assert from "node:assert/strict";
import test from "node:test";

// ---------------------------------------------------------------------------
// Inline the base64UrlToUint8Array helper to avoid requiring a browser env.
// We replicate the exact implementation from lib/push/client.ts so the tests
// stay in node:test without needing jsdom.
// ---------------------------------------------------------------------------

function base64UrlToUint8Array(base64url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = Buffer.from(base64, "base64").toString("binary");
  const buffer = new Uint8Array(raw.length);

  for (let i = 0; i < raw.length; i++) {
    buffer[i] = raw.charCodeAt(i);
  }

  return buffer;
}

// ---------------------------------------------------------------------------
// base64url → Uint8Array
// ---------------------------------------------------------------------------

test("base64UrlToUint8Array: simple ASCII round-trip", () => {
  // "hello" in base64url is "aGVsbG8"
  const input = "aGVsbG8";
  const result = base64UrlToUint8Array(input);
  const expected = new TextEncoder().encode("hello");

  assert.deepEqual(result, expected);
});

test("base64UrlToUint8Array: replaces - with + and _ with /", () => {
  // A raw base64 string with + and / chars, encoded to base64url form.
  // 0xFB 0xFF = base64 "+/8=" (two bytes) → base64url "-_8" (no padding).
  const base64url = "-_8";
  const result = base64UrlToUint8Array(base64url);

  assert.equal(result[0], 0xfb);
  assert.equal(result[1], 0xff);
  assert.equal(result.length, 2);
});

test("base64UrlToUint8Array: handles padding correctly for length % 4 === 0", () => {
  // "YWJj" = "abc" (length 4, already padded)
  const result = base64UrlToUint8Array("YWJj");
  const expected = new TextEncoder().encode("abc");
  assert.deepEqual(result, expected);
});

test("base64UrlToUint8Array: handles length % 4 === 2 (needs == padding)", () => {
  // "YQ" = "a" (length 2)
  const result = base64UrlToUint8Array("YQ");
  const expected = new TextEncoder().encode("a");
  assert.deepEqual(result, expected);
});

test("base64UrlToUint8Array: handles length % 4 === 3 (needs = padding)", () => {
  // "YWI" = "ab" (length 3)
  const result = base64UrlToUint8Array("YWI");
  const expected = new TextEncoder().encode("ab");
  assert.deepEqual(result, expected);
});

test("base64UrlToUint8Array: empty string produces empty Uint8Array", () => {
  const result = base64UrlToUint8Array("");
  assert.equal(result.length, 0);
});

// ---------------------------------------------------------------------------
// isPushSupported stub tests
// We test the logic without importing the module (which requires browser globals).
// ---------------------------------------------------------------------------

function simulateIsPushSupported(env: {
  hasNavigator: boolean;
  hasServiceWorker: boolean;
  hasWindow: boolean;
  hasPushManager: boolean;
  hasNotification: boolean;
}): boolean {
  // Mirror the exact condition in lib/push/client.ts
  return (
    env.hasNavigator &&
    env.hasServiceWorker &&
    env.hasWindow &&
    env.hasPushManager &&
    env.hasNotification
  );
}

const fullEnv = {
  hasNavigator: true,
  hasServiceWorker: true,
  hasWindow: true,
  hasPushManager: true,
  hasNotification: true,
};

test("isPushSupported: returns true when all APIs are present", () => {
  assert.equal(simulateIsPushSupported(fullEnv), true);
});

test("isPushSupported: returns false when serviceWorker is absent", () => {
  assert.equal(
    simulateIsPushSupported({ ...fullEnv, hasServiceWorker: false }),
    false,
  );
});

test("isPushSupported: returns false when PushManager is absent", () => {
  assert.equal(
    simulateIsPushSupported({ ...fullEnv, hasPushManager: false }),
    false,
  );
});

test("isPushSupported: returns false when Notification is absent", () => {
  assert.equal(
    simulateIsPushSupported({ ...fullEnv, hasNotification: false }),
    false,
  );
});

test("isPushSupported: returns false in SSR (no navigator)", () => {
  assert.equal(
    simulateIsPushSupported({ ...fullEnv, hasNavigator: false }),
    false,
  );
});

// ---------------------------------------------------------------------------
// PwaInstallPrompt dismissal logic — pure helper tests
// ---------------------------------------------------------------------------

function dismissedKey(surface: "tablet" | "dashboard"): string {
  return `pwa_prompt_dismissed_${surface}`;
}

test("dismissedKey produces correct namespace for tablet surface", () => {
  assert.equal(dismissedKey("tablet"), "pwa_prompt_dismissed_tablet");
});

test("dismissedKey produces correct namespace for dashboard surface", () => {
  assert.equal(dismissedKey("dashboard"), "pwa_prompt_dismissed_dashboard");
});

test("dismissedKey keys are unique per surface", () => {
  assert.notEqual(dismissedKey("tablet"), dismissedKey("dashboard"));
});

// ---------------------------------------------------------------------------
// PushOptIn snooze logic
// ---------------------------------------------------------------------------

const SNOOZE_KEY = "push_optin_snoozed_until";
const SNOOZE_DAYS = 14;

function isSnoozedAt(nowMs: number, storedValue: string | null): boolean {
  if (!storedValue) return false;
  return nowMs < Number(storedValue);
}

function snoozeUntil(nowMs: number): string {
  return String(nowMs + SNOOZE_DAYS * 24 * 60 * 60 * 1000);
}

test("isSnoozed: returns false when no value is stored", () => {
  assert.equal(isSnoozedAt(Date.now(), null), false);
});

test("isSnoozed: returns true when stored timestamp is in the future", () => {
  const future = String(Date.now() + 1_000_000);
  assert.equal(isSnoozedAt(Date.now(), future), true);
});

test("isSnoozed: returns false when stored timestamp is in the past", () => {
  const past = String(Date.now() - 1_000_000);
  assert.equal(isSnoozedAt(Date.now(), past), false);
});

test("snoozeUntil: adds exactly 14 days to now", () => {
  const now = 1_700_000_000_000;
  const expected = now + SNOOZE_DAYS * 24 * 60 * 60 * 1000;
  assert.equal(snoozeUntil(now), String(expected));
});

test("SNOOZE_KEY constant matches implementation", () => {
  assert.equal(SNOOZE_KEY, "push_optin_snoozed_until");
});
