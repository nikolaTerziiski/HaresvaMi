import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const recoveryLibSource = source("lib/feedback/recovery.ts");
const recoveryRouteSource = source("app/api/feedback/recovery/route.ts");
const submitFeedbackSource = source("lib/feedback/submit-feedback.ts");

// ── lib/feedback/recovery.ts ──────────────────────────────────────────────────

test("saveRecoveryComment filters by overall_rating = dislike", () => {
  assert.match(
    recoveryLibSource,
    /\.eq\(["']overall_rating["'],\s*["']dislike["']\)/,
  );
});

test("saveRecoveryComment filters out sessions without a completed_at", () => {
  assert.match(
    recoveryLibSource,
    /\.not\(["']completed_at["'],\s*["']is["'],\s*null\)/,
  );
});

test("saveRecoveryComment filters by created_at within 24 hours", () => {
  assert.match(
    recoveryLibSource,
    /\.gt\(["']created_at["'],\s*new Date\(Date\.now\(\)\s*-\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000\)\.toISOString\(\)\)/,
  );
});

test("saveRecoveryComment still filters by restaurant_id", () => {
  assert.match(
    recoveryLibSource,
    /\.eq\(["']restaurant_id["'],\s*restaurantId\)/,
  );
});

test("saveRecoveryComment returns { ok: false } when no row matched", () => {
  assert.match(recoveryLibSource, /return \{ ok: false \}/);
});

// ── app/api/feedback/recovery/route.ts ───────────────────────────────────────

test("recovery route imports canUseReputation from @/lib/billing/entitlements", () => {
  assert.match(
    recoveryRouteSource,
    /import[^;]*canUseReputation[^;]*from\s*["']@\/lib\/billing\/entitlements["']/,
  );
});

test("recovery route calls canUseReputation with body.restaurantId", () => {
  assert.match(recoveryRouteSource, /canUseReputation\(body\.restaurantId\)/);
});

test("recovery route returns 403 when canUseReputation is false", () => {
  // Use the call-site form (with argument) to skip past the import line
  const callIndex = recoveryRouteSource.indexOf(
    "canUseReputation(body.restaurantId)",
  );
  // Use the invocation form (with opening brace) to skip past the import line
  const saveCallIndex = recoveryRouteSource.indexOf("saveRecoveryComment({");
  assert.notEqual(
    callIndex,
    -1,
    "canUseReputation(body.restaurantId) call not found",
  );
  assert.notEqual(saveCallIndex, -1, "saveRecoveryComment({ call not found");
  assert.ok(
    callIndex < saveCallIndex,
    "canUseReputation gate must precede saveRecoveryComment call",
  );

  // Verify 403 status is returned in the gate block
  const gateBlock = recoveryRouteSource.slice(callIndex, saveCallIndex);
  assert.match(gateBlock, /status:\s*403/);
  assert.match(gateBlock, /ok:\s*false/);
});

test("recovery route preserves ZodError→400 handling", () => {
  assert.match(recoveryRouteSource, /ZodError/);
  assert.match(recoveryRouteSource, /status:\s*400/);
});

test("recovery route preserves not-found→404 handling", () => {
  assert.match(recoveryRouteSource, /status:\s*404/);
  assert.match(recoveryRouteSource, /session_not_found/);
});

// ── lib/feedback/submit-feedback.ts ──────────────────────────────────────────

test("submit-feedback uses canUseReputation instead of restaurantHasReputationAccess", () => {
  assert.match(submitFeedbackSource, /canUseReputation/);
  assert.doesNotMatch(submitFeedbackSource, /restaurantHasReputationAccess/);
});

test("submit-feedback imports canUseReputation from @/lib/billing/entitlements", () => {
  assert.match(
    submitFeedbackSource,
    /import[^;]*canUseReputation[^;]*from\s*["']@\/lib\/billing\/entitlements["']/,
  );
});

test("submit-feedback wraps low-rating alert in error-swallowing catch", () => {
  // The alert path must use .catch() to swallow errors
  assert.match(submitFeedbackSource, /\.catch\(/);
  // canUseReputation is called with restaurantId
  assert.match(submitFeedbackSource, /canUseReputation\(input\.restaurantId\)/);
});

test("submit-feedback does not import restaurantHasReputationAccess", () => {
  assert.doesNotMatch(submitFeedbackSource, /restaurantHasReputationAccess/);
});
