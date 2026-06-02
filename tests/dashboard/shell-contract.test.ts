import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const marketingLayoutSource = source("app/(marketing)/layout.tsx");
const dashboardShellLayoutSource = source(
  "app/(dashboard)/dashboard/(shell)/layout.tsx",
);
const dashboardHomePageSource = source(
  "app/(dashboard)/dashboard/(shell)/page.tsx",
);
const dashboardHomeDataSource = source("lib/dashboard/home.ts");
const topbarSource = source("components/dashboard/shell/Topbar.tsx");
const sidebarSource = source("components/dashboard/shell/Sidebar.tsx");
const mobileTopbarSource = source(
  "components/dashboard/shell/MobileTopbar.tsx",
);
const bgMessagesSource = source("lib/i18n/messages/bg.json");
const getStartedChecklistSource = source(
  "components/dashboard/home/GetStartedChecklist.tsx",
);
const pageFrameSource = source("components/dashboard/shell/page-frame.ts");
const feedbackOverviewSource = source(
  "components/dashboard/feedback/FeedbackOverview.tsx",
);
const insightsOverviewSource = source(
  "components/dashboard/insights/InsightsOverview.tsx",
);
const menuPageSource = source(
  "app/(dashboard)/dashboard/(shell)/menu/page.tsx",
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

test("dashboard topbar is section-aware instead of greeting-led", () => {
  assert.match(topbarSource, /"use client"/);
  assert.match(topbarSource, /usePathname/);
  assert.match(topbarSource, /getSectionKey\(pathname\)/);
  assert.match(topbarSource, /sections\.\$\{sectionKey\}\.title/);
  assert.match(topbarSource, /sections\.\$\{sectionKey\}\.hint/);
  assert.doesNotMatch(topbarSource, /greetingKey/);
  assert.doesNotMatch(topbarSource, /dashboard\.greetings/);
});

test("Bulgarian dashboard nav labels insights as statistics", () => {
  assert.match(bgMessagesSource, /"insights": "Статистика"/);
  assert.match(bgMessagesSource, /"title": "Статистика"/);
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

test("dashboard shell renders the effective tier chip from server data", () => {
  assert.match(dashboardShellLayoutSource, /tier=\{data\.tier\}/);
  assert.match(sidebarSource, /tier: PlanTier/);
  assert.match(mobileTopbarSource, /tier: PlanTier/);
  assert.match(sidebarSource, /shell\(`tierChip\.\$\{tier\}`\)/);
  assert.match(mobileTopbarSource, /shell\(`tierChip\.\$\{tier\}`\)/);
  assert.doesNotMatch(sidebarSource, /tierChipFree/);
  assert.doesNotMatch(mobileTopbarSource, /tierChipFree/);
});

test("dashboard home data uses the effective tier and limit", () => {
  assert.match(dashboardHomeDataSource, /getFeedbackLimit\(tier\)/);
  assert.doesNotMatch(dashboardHomeDataSource, /FREE_TIER_FEEDBACK_LIMIT/);
});

test("home checklist card uses standard radius and a subtle shadow", () => {
  assert.match(getStartedChecklistSource, /rounded-xl/);
  assert.doesNotMatch(getStartedChecklistSource, /rounded-\[14px\]/);
  assert.doesNotMatch(getStartedChecklistSource, /shadow-\[0_30px_60px/);
});

test("home page is simplified: checklist + app nudge, no plan/tutorial cards", () => {
  assert.match(dashboardHomePageSource, /GetStartedChecklist/);
  assert.match(dashboardHomePageSource, /HomeAppNudge/);
  assert.doesNotMatch(dashboardHomePageSource, /TierCard/);
  assert.doesNotMatch(dashboardHomePageSource, /TutorialCard/);
});

test("standard dashboard overviews use the shared content frame", () => {
  for (const overviewSource of [
    feedbackOverviewSource,
    insightsOverviewSource,
  ]) {
    assert.match(
      overviewSource,
      /import \{ DASHBOARD_PAGE_FRAME_CLASS \} from "@\/components\/dashboard\/shell\/page-frame"/,
    );
    assert.match(overviewSource, /className=\{DASHBOARD_PAGE_FRAME_CLASS\}/);
    assert.doesNotMatch(overviewSource, /className="w-full px-10/);
  }
});

test("nested-page breadcrumb logic is shared between desktop and mobile shells", () => {
  assert.match(topbarSource, /from "\.\/sections"/);
  assert.match(mobileTopbarSource, /from "\.\/sections"/);
  assert.match(
    mobileTopbarSource,
    /PARENT_SECTIONS\[getSectionKey\(pathname\)\]/,
  );
  assert.doesNotMatch(
    mobileTopbarSource,
    /startsWith\("\/dashboard\/menu\/import-ai"\)/,
  );
});

test("standard dashboard frame is a centered column with an aligned topbar", () => {
  // Pages sit in a centered max-w-5xl column; the topbar's inner row centers to
  // the SAME width so the section title lines up with the content (no detached
  // header, no lopsided empty gap).
  assert.match(
    pageFrameSource,
    /DASHBOARD_PAGE_FRAME_CLASS =\s*"mx-auto w-full max-w-5xl/,
  );
  // Topbar centers to the same width by default; the full-bleed menu page opts out.
  assert.match(topbarSource, /mx-auto max-w-5xl/);
  assert.match(topbarSource, /isFullBleed = pathname === "\/dashboard\/menu"/);
});

test("menu page is a documented full-bleed exception", () => {
  assert.match(
    menuPageSource,
    /import \{ DASHBOARD_PAGE_FULL_CLASS \} from "@\/components\/dashboard\/shell\/page-frame"/,
  );
  assert.match(menuPageSource, /className=\{DASHBOARD_PAGE_FULL_CLASS\}/);
});
