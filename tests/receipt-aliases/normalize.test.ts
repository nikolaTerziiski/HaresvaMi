import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeReceiptAlias,
  RECEIPT_ALIAS_MAX_LENGTH,
} from "@/lib/receipt-aliases/normalize";

test("receipt alias normalization trims and collapses whitespace", () => {
  assert.equal(normalizeReceiptAlias("  pk\t  x2\n"), "PK X2");
});

test("receipt alias normalization uppercases Bulgarian and Latin text", () => {
  assert.equal(normalizeReceiptAlias("шопс pk"), "ШОПС PK");
});

test("receipt alias normalization limits aliases to 120 characters", () => {
  const normalized = normalizeReceiptAlias("a".repeat(150));

  assert.equal(normalized.length, RECEIPT_ALIAS_MAX_LENGTH);
  assert.equal(normalized, "A".repeat(RECEIPT_ALIAS_MAX_LENGTH));
});
