import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routeSource = readFileSync(
  join(process.cwd(), "app/api/extract-receipt/route.ts"),
  "utf8",
);
const extractorSource = readFileSync(
  join(process.cwd(), "lib/ai/extract-receipt.ts"),
  "utf8",
);
const geminiProviderSource = readFileSync(
  join(process.cwd(), "lib/ai/providers/gemini-receipt.ts"),
  "utf8",
);
const kioskSource = readFileSync(
  join(process.cwd(), "components/kiosk/KioskScanScreen.tsx"),
  "utf8",
);

test("receipt extraction checks entitlement server-side before Gemini", () => {
  const entitlementIndex = extractorSource.indexOf(
    "const entitlement = await canScanReceipt",
  );
  const geminiIndex = extractorSource.indexOf("callGeminiForReceipt({");

  assert.notEqual(entitlementIndex, -1);
  assert.notEqual(geminiIndex, -1);
  assert.ok(entitlementIndex < geminiIndex);
});

test("failed AI extraction returns before consuming scan credit", () => {
  const failureBranchIndex = extractorSource.indexOf("if (!result.ok)");
  const consumeIndex = extractorSource.indexOf(
    "const consumed = await consumeAiScanCredit",
  );

  assert.notEqual(failureBranchIndex, -1);
  assert.notEqual(consumeIndex, -1);
  assert.ok(failureBranchIndex < consumeIndex);
});

test("successful AI extraction consumes scan credit exactly once", () => {
  const matches = extractorSource.match(
    /consumeAiScanCredit\(payload\.restaurantId\)/g,
  );

  assert.equal(matches?.length, 1);
});

test("kiosk client does not call Gemini directly", () => {
  assert.equal(kioskSource.includes("GoogleGenerativeAI"), false);
  assert.equal(kioskSource.includes("generateContent"), false);
  assert.equal(kioskSource.includes("GOOGLE_GEMINI_API_KEY"), false);
});

test("receipt extraction rate limit runs before entitlement and Gemini", () => {
  const rateLimitIndex = routeSource.indexOf(
    "const rateLimit = checkReceiptExtractionRateLimit",
  );
  const extractorCallIndex = routeSource.indexOf(
    "const result = await extractReceipt",
  );
  const entitlementIndex = extractorSource.indexOf(
    "const entitlement = await canScanReceipt",
  );
  const geminiIndex = extractorSource.indexOf("callGeminiForReceipt({");

  assert.notEqual(rateLimitIndex, -1);
  assert.notEqual(extractorCallIndex, -1);
  assert.notEqual(entitlementIndex, -1);
  assert.notEqual(geminiIndex, -1);
  assert.ok(rateLimitIndex < extractorCallIndex);
  assert.ok(entitlementIndex < geminiIndex);
});

test("receipt route stays thin and Gemini-specific code stays in provider", () => {
  const routeLines = routeSource.trim().split(/\r?\n/);

  assert.ok(routeLines.length < 200);
  assert.equal(routeSource.includes("GoogleGenerativeAI"), false);
  assert.equal(routeSource.includes("generateContent"), false);
  assert.ok(geminiProviderSource.includes("GoogleGenerativeAI"));
});
