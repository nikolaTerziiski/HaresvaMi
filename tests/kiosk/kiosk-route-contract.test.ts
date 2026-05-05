import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const connectRouteSource = source("app/kiosk/connect/route.ts");
const feedbackRouteSource = source("app/api/feedback/route.ts");
const extractReceiptRouteSource = source("app/api/extract-receipt/route.ts");

test("/kiosk/connect sets the kiosk cookie for all app routes", () => {
  assert.match(connectRouteSource, /path:\s*"\/"/);
});

test("/kiosk/connect sets the kiosk cookie as HttpOnly", () => {
  assert.match(connectRouteSource, /httpOnly:\s*true/);
});

test("/kiosk/connect only sets secure cookies in production", () => {
  assert.match(
    connectRouteSource,
    /secure:\s*process\.env\.NODE_ENV\s*===\s*"production"/,
  );
});

test("/api/feedback authorizes kiosk or owner before submitting feedback", () => {
  const authorizationIndex = feedbackRouteSource.indexOf(
    "const authorization = await authorizeKioskOrOwnerRestaurant",
  );
  const submitIndex = feedbackRouteSource.indexOf(
    "const result = await submitFeedback",
  );

  assert.notEqual(authorizationIndex, -1);
  assert.notEqual(submitIndex, -1);
  assert.ok(authorizationIndex < submitIndex);
});

test("/api/extract-receipt authorizes kiosk or owner before extracting receipt", () => {
  const authorizationIndex = extractReceiptRouteSource.indexOf(
    "const authorization = await authorizeKioskOrOwnerRestaurant",
  );
  const extractIndex = extractReceiptRouteSource.indexOf(
    "const result = await extractReceipt",
  );

  assert.notEqual(authorizationIndex, -1);
  assert.notEqual(extractIndex, -1);
  assert.ok(authorizationIndex < extractIndex);
});
