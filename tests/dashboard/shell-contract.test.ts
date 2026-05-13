import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const marketingLayoutSource = source("app/(marketing)/layout.tsx");
const topbarSource = source("components/dashboard/shell/Topbar.tsx");
const sidebarSource = source("components/dashboard/shell/Sidebar.tsx");
const mobileTopbarSource = source(
  "components/dashboard/shell/MobileTopbar.tsx",
);
const feedbackOverviewSource = source(
  "components/dashboard/feedback/FeedbackOverview.tsx",
);

function assertSourceOrder(haystack: string, needles: string[]) {
  let previousIndex = -1;

  for (const needle of needles) {
    const index = haystack.indexOf(needle);
    assert.notEqual(index, -1, `Missing source fragment: ${needle}`);
    assert.ok(
      index > previousIndex,
      `Expected ${needle} to appear after the previous fragment.`,
    );
    previousIndex = index;
  }
}

test("landing redirects active owner sessions to the dashboard", () => {
  assert.match(marketingLayoutSource, /getCurrentOwnerState/);
  assert.match(
    marketingLayoutSource,
    /redirect\(getOwnerDestination\(restaurant\)\)/,
  );
});

test("landing redirects valid kiosk sessions to the kiosk scan screen", () => {
  assert.match(marketingLayoutSource, /KIOSK_SESSION_COOKIE/);
  assert.match(marketingLayoutSource, /verifyKioskToken\(token\)/);
  assert.match(marketingLayoutSource, /redirect\("\/kiosk\/scan"\)/);
});

test("dashboard topbar has no dead notification button or profile stub link", () => {
  assert.doesNotMatch(topbarSource, /<Bell /);
  assert.doesNotMatch(topbarSource, /type="button"/);
  assert.doesNotMatch(topbarSource, /href="\/dashboard\/profile"/);
});

test("dashboard nav promotes insights above raw feedback", () => {
  assertSourceOrder(sidebarSource, [
    'href="/dashboard/insights"',
    'href="/dashboard/feedback"',
  ]);
  assertSourceOrder(mobileTopbarSource, [
    'href="/dashboard/insights"',
    'href="/dashboard/feedback"',
  ]);
});

test("team and profile stubs are hidden from dashboard navigation", () => {
  assert.doesNotMatch(sidebarSource, /href="\/dashboard\/staff"/);
  assert.doesNotMatch(sidebarSource, /href="\/dashboard\/profile"/);
  assert.doesNotMatch(mobileTopbarSource, /href="\/dashboard\/staff"/);
  assert.doesNotMatch(mobileTopbarSource, /href="\/dashboard\/profile"/);
  assert.doesNotMatch(topbarSource, /href="\/dashboard\/profile"/);
});

test("feedback overview uses the full dashboard content width", () => {
  assert.match(feedbackOverviewSource, /className="w-full px-10/);
  assert.doesNotMatch(feedbackOverviewSource, /max-w-6xl/);
});
