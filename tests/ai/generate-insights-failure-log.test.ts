import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

/**
 * Contract tests for AI failure logging in generate-insights.ts.
 *
 * AGENTS.md mandates: "Always log model name, input tokens, output tokens,
 * total tokens, success/failure, and estimated cost for AI calls."
 *
 * These tests verify at the source-code level that generateInsightSummary()
 * wraps the Gemini call in try/catch and logs a failed ai_usage_events row
 * before re-throwing, so the caller's catch still controls flow.
 *
 * We use source inspection (same pattern as extract-receipt-route.test.ts)
 * because the function requires Supabase + Gemini credentials to instantiate.
 */

const source = readFileSync(
  join(process.cwd(), "lib/ai/generate-insights.ts"),
  "utf8",
);

test("generateInsightSummary wraps the Gemini call in try/catch", () => {
  assert.ok(
    source.includes("try {") && source.includes("} catch (aiError) {"),
    "Expected a try/catch block around the Gemini call",
  );
});

test("failure path calls insertAiUsageEvent with success: false", () => {
  const catchBlockStart = source.indexOf("} catch (aiError) {");
  assert.notEqual(catchBlockStart, -1, "catch (aiError) block must exist");

  const catchSection = source.slice(catchBlockStart, catchBlockStart + 600);

  assert.ok(
    catchSection.includes("insertAiUsageEvent("),
    "catch block must call insertAiUsageEvent",
  );

  assert.ok(
    catchSection.includes("success: false"),
    "catch block must log success: false",
  );
});

test("failure path includes failure_reason in the logged event", () => {
  const catchBlockStart = source.indexOf("} catch (aiError) {");
  const catchSection = source.slice(catchBlockStart, catchBlockStart + 600);

  assert.ok(
    catchSection.includes("failureReason"),
    "catch block must include failureReason in the usage event",
  );
});

test("failure path re-throws so the caller controls flow", () => {
  const catchBlockStart = source.indexOf("} catch (aiError) {");
  const catchSection = source.slice(catchBlockStart, catchBlockStart + 800);

  assert.ok(
    catchSection.includes("throw aiError"),
    "catch block must re-throw the original error",
  );
});

test("success path still logs with success: true", () => {
  // After the catch block ends, a second insertAiUsageEvent with success: true
  // must exist for the happy path.
  const allInserts = [...source.matchAll(/insertAiUsageEvent\(/g)];

  assert.ok(
    allInserts.length >= 2,
    `Expected at least 2 insertAiUsageEvent calls (one for failure, one for success), found ${allInserts.length}`,
  );

  assert.ok(
    source.includes("success: true"),
    "success path must log success: true",
  );
});

test("failure path logs zero token counts", () => {
  const catchBlockStart = source.indexOf("} catch (aiError) {");
  const catchSection = source.slice(catchBlockStart, catchBlockStart + 600);

  // All three token fields must be zero in the failure row.
  assert.ok(
    catchSection.includes("inputTokens: 0"),
    "catch block must log inputTokens: 0",
  );
  assert.ok(
    catchSection.includes("outputTokens: 0"),
    "catch block must log outputTokens: 0",
  );
  assert.ok(
    catchSection.includes("totalTokens: 0"),
    "catch block must log totalTokens: 0",
  );
});
