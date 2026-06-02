import assert from "node:assert/strict";
import test from "node:test";

import type { ExtractedReceiptItem } from "@/lib/ai/providers/gemini-receipt";
import { applyDeterministicAliasMatches } from "@/lib/receipt-aliases/match";

const menu = [
  { id: "m1", name_bg: "Пилешко филе на скара" },
  { id: "m2", name_bg: "Шопска салата" },
];

const aliases = [
  { alias: "ПФ", menu_item_id: "m1" },
  { alias: "ШОП", menu_item_id: "m2" },
];

function item(over: Partial<ExtractedReceiptItem>): ExtractedReceiptItem {
  return {
    raw_text: "",
    menu_item_id: null,
    menu_item_name: null,
    quantity: 1,
    matched_via: "unknown",
    ...over,
  };
}

test("a receipt line equal to a known alias is forced to that dish (case/space-insensitive)", () => {
  const [out] = applyDeterministicAliasMatches(
    [item({ raw_text: "  пф " })],
    menu,
    aliases,
  );
  assert.equal(out.menu_item_id, "m1");
  assert.equal(out.menu_item_name, "Пилешко филе на скара");
  assert.equal(out.matched_via, "alias");
});

test("an alias overrides a wrong model match", () => {
  const [out] = applyDeterministicAliasMatches(
    [
      item({
        raw_text: "ШОП",
        menu_item_id: "m1",
        menu_item_name: "Пилешко филе на скара",
        matched_via: "fuzzy_match",
      }),
    ],
    menu,
    aliases,
  );
  assert.equal(out.menu_item_id, "m2");
  assert.equal(out.menu_item_name, "Шопска салата");
  assert.equal(out.matched_via, "alias");
});

test("aliases pointing at inactive/deleted dishes are ignored", () => {
  const [out] = applyDeterministicAliasMatches(
    [
      item({
        raw_text: "СТАР",
        menu_item_id: "m1",
        matched_via: "fuzzy_match",
      }),
    ],
    menu,
    [{ alias: "СТАР", menu_item_id: "deleted-item" }],
  );
  // Not overridden to a dead item — the model's match is kept.
  assert.equal(out.menu_item_id, "m1");
  assert.equal(out.matched_via, "fuzzy_match");
});

test("lines without a matching alias are untouched", () => {
  const [out] = applyDeterministicAliasMatches(
    [
      item({
        raw_text: "Нещо друго",
        menu_item_id: "m2",
        matched_via: "fuzzy_match",
      }),
    ],
    menu,
    aliases,
  );
  assert.equal(out.menu_item_id, "m2");
  assert.equal(out.matched_via, "fuzzy_match");
});

test("no aliases returns the items unchanged (same reference)", () => {
  const items = [item({ raw_text: "ПФ" })];
  assert.equal(applyDeterministicAliasMatches(items, menu, []), items);
});
