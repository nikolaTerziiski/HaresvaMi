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
const feedbackOverviewSource = source(
  "components/dashboard/feedback/FeedbackOverview.tsx",
);

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

test("landing gives kiosk mode priority over owner dashboard redirects", () => {
  assertSourceOrder(marketingLayoutSource, [
    "if (await hasValidKioskSession())",
    'redirect("/kiosk/scan")',
    "const { user, restaurant } = await getCurrentOwnerState()",
    "redirect(getOwnerDestination(restaurant))",
  ]);
});

test("dashboard topbar has one functional home action and no dead notification button", () => {
  assert.match(topbarSource, /href="\/dashboard"/);
  assert.match(topbarSource, /<Home /);
  assert.doesNotMatch(topbarSource, /<Bell /);
  assert.doesNotMatch(topbarSource, /type="button"/);
});

test("sidebar keeps the account block clear of the desktop dev badge", () => {
  assert.match(sidebarSource, /pb-8/);
  assert.match(sidebarSource, /href="\/dashboard\/profile"/);
});

test("feedback overview uses the full dashboard content width", () => {
  assert.match(feedbackOverviewSource, /className="w-full px-10/);
  assert.doesNotMatch(feedbackOverviewSource, /max-w-6xl/);
});
