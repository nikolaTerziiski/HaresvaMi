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
const authorizationSource = source("lib/kiosk/authorization.ts");

function assertSourceOrder(fileSource: string, snippets: string[]) {
  let previousIndex = -1;

  for (const snippet of snippets) {
    const nextIndex = fileSource.indexOf(snippet, previousIndex + 1);

    assert.notEqual(nextIndex, -1, `Missing source snippet: ${snippet}`);
    assert.ok(
      nextIndex > previousIndex,
      `Expected snippet to appear later: ${snippet}`,
    );

    previousIndex = nextIndex;
  }
}

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
  assertSourceOrder(feedbackRouteSource, [
    "const authorization = await authorizeKioskOrOwnerRestaurant",
    "const result = await submitFeedback",
  ]);
});

test("/api/feedback returns failed authorization before submitting feedback", () => {
  assertSourceOrder(feedbackRouteSource, [
    "const authorization = await authorizeKioskOrOwnerRestaurant",
    "if (!authorization.ok)",
    "return NextResponse.json(authorization.body",
    "const result = await submitFeedback",
  ]);
});

test("/api/feedback overwrites payload restaurant id with authorized restaurant id", () => {
  assert.match(
    feedbackRouteSource,
    /submitFeedback\(\s*\{[\s\S]*\.\.\.payload,[\s\S]*restaurantId:\s*authorization\.restaurantId,[\s\S]*\}\s*\)/,
  );
});

test("/api/extract-receipt authorizes kiosk or owner before extracting receipt", () => {
  assertSourceOrder(extractReceiptRouteSource, [
    "const authorization = await authorizeKioskOrOwnerRestaurant",
    "const result = await extractReceipt",
  ]);
});

test("/api/extract-receipt uses authorized restaurant id for rate limiting", () => {
  assert.match(
    extractReceiptRouteSource,
    /checkReceiptExtractionRateLimit\(\s*request,\s*authorization\.restaurantId,\s*\)/,
  );
});

test("/api/extract-receipt uses authorized restaurant id in extraction payload", () => {
  assert.match(
    extractReceiptRouteSource,
    /extractReceipt\(\s*\{[\s\S]*restaurantId:\s*authorization\.restaurantId,/,
  );
});

test("kiosk authorization accepts cookie, x-kiosk-token header, and bearer token", () => {
  assert.match(
    authorizationSource,
    /request\.cookies\.get\(KIOSK_SESSION_COOKIE\)\?\.value/,
  );
  assert.match(authorizationSource, /request\.headers\.get\("x-kiosk-token"\)/);
  assert.match(authorizationSource, /bearerToken\(request\)/);
  assert.match(
    authorizationSource,
    /scheme\?\.toLowerCase\(\)\s*===\s*"bearer"\s*\?\s*token\s*:\s*null/,
  );
});
