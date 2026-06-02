import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const overviewSource = source(
  "components/dashboard/feedback/FeedbackOverview.tsx",
);
const dishListSource = source(
  "components/dashboard/feedback/FeedbackDishList.tsx",
);
const commentsSource = source(
  "components/dashboard/feedback/FeedbackCommentsList.tsx",
);
const summaryCardsSource = source(
  "components/dashboard/feedback/FeedbackSummaryCards.tsx",
);
const emptyStateSource = source(
  "components/dashboard/feedback/FeedbackEmptyState.tsx",
);

test("FeedbackOverview renders FeedbackEmptyState when there is no feedback", () => {
  // Must import FeedbackEmptyState
  assert.match(overviewSource, /FeedbackEmptyState/);
  // Must gate on completedSessions > 0
  assert.match(overviewSource, /completedSessions > 0/);
  // Must render <FeedbackEmptyState in the !hasFeedback branch
  assert.match(overviewSource, /<FeedbackEmptyState/);
});

test("FeedbackOverview populated state references FeedbackCommentsList", () => {
  assert.match(overviewSource, /<FeedbackCommentsList/);
});

test("FeedbackOverview populated state uses FeedbackDishList with variant rank", () => {
  assert.match(overviewSource, /variant="rank"/);
});

test("FeedbackOverview populated state uses FeedbackDishList with variant average", () => {
  assert.match(overviewSource, /variant="average"/);
});

test("FeedbackOverview no longer renders FeedbackRecentSessions", () => {
  assert.doesNotMatch(overviewSource, /FeedbackRecentSessions/);
});

test("FeedbackDishList supports variant rank and average", () => {
  assert.match(dishListSource, /variant.*rank/);
  assert.match(dishListSource, /variant.*average/);
});

test("FeedbackDishList rank bars use var(--good) and var(--bad) via tone prop", () => {
  assert.match(dishListSource, /var\(--good\)/);
  assert.match(dishListSource, /var\(--bad\)/);
});

test("FeedbackDishList average variant uses gradient bar", () => {
  assert.match(
    dishListSource,
    /linear-gradient\(90deg,var\(--accent-2\),var\(--good\)\)/,
  );
});

test("FeedbackCommentsList uses sentiment dots with good and bad tokens", () => {
  assert.match(commentsSource, /var\(--good\)/);
  assert.match(commentsSource, /var\(--bad\)/);
});

test("FeedbackCommentsList renders a scrollable comment list capped at 300px", () => {
  assert.match(commentsSource, /300px/);
  assert.match(commentsSource, /overflow-y-auto/);
});

test("FeedbackSummaryCards computes likePct and dislikePct from counts", () => {
  assert.match(summaryCardsSource, /overallLike \+ overallDislike/);
  assert.match(summaryCardsSource, /likePct/);
  assert.match(summaryCardsSource, /dislikePct/);
});

test("FeedbackSummaryCards shows a dash when no votes exist", () => {
  assert.match(summaryCardsSource, /—/);
});

test("FeedbackEmptyState includes the live pill with animate-pulse dot", () => {
  assert.match(emptyStateSource, /animate-pulse/);
  assert.match(emptyStateSource, /Готови · слушаме за първия отзив/);
});

test("FeedbackEmptyState has a ghost preview section", () => {
  assert.match(emptyStateSource, /така ще изглежда след първите отзиви/);
  assert.match(emptyStateSource, /pointer-events-none/);
  assert.match(emptyStateSource, /opacity-50/);
});

test("FeedbackEmptyState CTA links to tablet page", () => {
  assert.match(emptyStateSource, /href="\/dashboard\/tablet"/);
  assert.match(emptyStateSource, /Провери таблета/);
});
