import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const tabletSetupSource = source("hooks/useTabletSetup.ts");
const kioskScreenSource = source("components/kiosk/KioskScanScreen.tsx");
const scanFlowSource = source("hooks/useKioskScanFlow.ts");
const customerPanelSource = source("components/kiosk/scan/CustomerPanel.tsx");
const kioskClientApiSource = source("lib/kiosk/client-api.ts");
const feedbackPageSource = source(
  "app/(dashboard)/dashboard/(shell)/feedback/page.tsx",
);
const feedbackDashboardSource = source("lib/feedback/dashboard.ts");
const feedbackQueriesSource = source("lib/feedback/dashboard-queries.ts");

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

test("MVP tablet setup creates a kiosk connect link", () => {
  assert.match(tabletSetupSource, /fetch\("\/api\/kiosk\/sessions"/);
  assert.match(tabletSetupSource, /setupUrl/);
  assert.match(tabletSetupSource, /window\.location\.assign/);
  assertSourceOrder(tabletSetupSource, [
    'const nextSetupUrl = await createSession("Този браузър")',
    "await supabase.auth.signOut()",
    "window.location.assign(toAbsoluteSetupUrl(nextSetupUrl))",
  ]);
});

test("MVP manual kiosk flow can select menu items and reach customer rating", () => {
  assert.match(kioskScreenSource, /<ManualPanel/);
  assert.match(scanFlowSource, /toggleMenuItem/);
  assertSourceOrder(scanFlowSource, [
    "function continueWithManualSelection()",
    "setSelectedItems(manualSelectedItems)",
    'setMode("ready")',
  ]);
  assert.match(
    kioskScreenSource,
    /onStartCustomerStep=\{flow\.showCustomerStep\}/,
  );
});

test("MVP customer rating submits feedback through the API", () => {
  assert.match(customerPanelSource, /onFinish/);
  assert.match(scanFlowSource, /submitCustomerFeedback/);
  assert.match(kioskClientApiSource, /fetch\("\/api\/feedback"/);
  assert.match(kioskClientApiSource, /ratings:\s*itemRatings/);
  assert.match(kioskClientApiSource, /overallRating/);
});

test("MVP feedback dashboard reads completed feedback after submission", () => {
  assert.match(feedbackPageSource, /getFeedbackDashboardData/);
  assert.match(feedbackDashboardSource, /loadCompletedSessions/);
  assert.match(feedbackDashboardSource, /loadRatingsForSessions/);
  assert.match(feedbackQueriesSource, /\.from\("feedback_sessions"\)/);
  assert.match(feedbackQueriesSource, /\.not\("completed_at", "is", null\)/);
});
