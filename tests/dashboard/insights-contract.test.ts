import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

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

const overviewSource = source(
  "components/dashboard/insights/InsightsOverview.tsx",
);
const highlightsSource = source(
  "components/dashboard/insights/InsightHighlights.tsx",
);
const periodSwitcherSource = source(
  "components/dashboard/insights/PeriodSwitcher.tsx",
);

test("insights reads numbers-first: stats then narrative then highlights then deep dive", () => {
  assertSourceOrder(overviewSource, [
    "<InsightsSummary",
    "<InsightsAiSummary",
    "<InsightHighlights",
    "Подробно",
  ]);
});

test("insights highlight cards are quiet, not a second big-number zone", () => {
  assert.doesNotMatch(highlightsSource, /text-\[27px\]/);
  assert.doesNotMatch(highlightsSource, /text-\[44px\]/);
});

test("period switcher no longer hard-codes its own top margin", () => {
  assert.doesNotMatch(periodSwitcherSource, /className="mt-6"/);
});
