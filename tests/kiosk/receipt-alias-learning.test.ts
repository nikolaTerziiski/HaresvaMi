import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  createReceiptReviewDecisions,
  getLearnableReceiptAliasMappings,
  ignoreReceiptReviewDecision,
  mapApiReceiptItemsToReceiptMatches,
  updateReceiptReviewDecisionMenuItem,
} from "@/lib/kiosk/selection";

const scanFlowSource = readFileSync(
  join(process.cwd(), "hooks/useKioskScanFlow.ts"),
  "utf8",
);
const clientApiSource = readFileSync(
  join(process.cwd(), "lib/kiosk/client-api.ts"),
  "utf8",
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

test("receipt review learns aliases before continuing to ready state", () => {
  assertSourceOrder(scanFlowSource, [
    "const learnableAliases = receiptReview.getLearnableAliases",
    "const response = await learnReceiptAliasesForKiosk",
    "setSelectedItems(confirmedItems)",
    'setMode("ready")',
  ]);
});

test("receipt alias learning failures do not block the rating flow", () => {
  assertSourceOrder(scanFlowSource, [
    "catch {",
    "nextStatusMessage",
    "setSelectedItems(confirmedItems)",
    'setMode("ready")',
  ]);
});

test("kiosk client posts learnable aliases to the receipt alias API", () => {
  assert.match(clientApiSource, /fetch\("\/api\/receipt-aliases\/learn"/);
  assert.match(clientApiSource, /body:\s*JSON\.stringify\(\{\s*aliases\s*\}\)/);
});

test("manual mapping of an unknown receipt row is learnable", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "pk x2",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 2,
      matched_via: "unknown",
    },
  ]);
  const decisions = updateReceiptReviewDecisionMenuItem(
    createReceiptReviewDecisions(matches),
    matches,
    0,
    "22222222-2222-4222-8222-222222222222",
  );

  assert.deepEqual(getLearnableReceiptAliasMappings(matches, decisions), [
    {
      rawText: "pk x2",
      menuItemId: "22222222-2222-4222-8222-222222222222",
    },
  ]);
});

test("unchanged alias matches are not learned again", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "PK",
      menu_item_id: "22222222-2222-4222-8222-222222222222",
      menu_item_name: "Kebapche",
      quantity: 1,
      matched_via: "alias",
    },
  ]);

  assert.deepEqual(
    getLearnableReceiptAliasMappings(
      matches,
      createReceiptReviewDecisions(matches),
    ),
    [],
  );
});

test("changed alias matches are learnable", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "PK",
      menu_item_id: "22222222-2222-4222-8222-222222222222",
      menu_item_name: "Kebapche",
      quantity: 1,
      matched_via: "alias",
    },
  ]);
  const decisions = updateReceiptReviewDecisionMenuItem(
    createReceiptReviewDecisions(matches),
    matches,
    0,
    "33333333-3333-4333-8333-333333333333",
  );

  assert.deepEqual(getLearnableReceiptAliasMappings(matches, decisions), [
    {
      rawText: "PK",
      menuItemId: "33333333-3333-4333-8333-333333333333",
    },
  ]);
});

test("ignored and empty receipt rows are not learned", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "  ",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 1,
      matched_via: "unknown",
    },
    {
      raw_text: "SVC",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 1,
      matched_via: "unknown",
    },
  ]);
  const mapped = updateReceiptReviewDecisionMenuItem(
    createReceiptReviewDecisions(matches),
    matches,
    0,
    "22222222-2222-4222-8222-222222222222",
  );
  const ignored = ignoreReceiptReviewDecision(
    updateReceiptReviewDecisionMenuItem(
      mapped,
      matches,
      1,
      "33333333-3333-4333-8333-333333333333",
    ),
    1,
  );

  assert.deepEqual(getLearnableReceiptAliasMappings(matches, ignored), []);
});
