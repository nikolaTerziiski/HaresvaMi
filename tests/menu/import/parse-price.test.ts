import assert from "node:assert/strict";
import test from "node:test";

import { parseBgPrice } from "@/lib/menu/parse-price";

test("plain float with dot → parsed correctly", () => {
  assert.equal(parseBgPrice("12.90"), 12.9);
});

test("comma decimal separator → parsed correctly", () => {
  assert.equal(parseBgPrice("12,90"), 12.9);
});

test("price with лв suffix → stripped and parsed", () => {
  assert.equal(parseBgPrice("12.50 лв"), 12.5);
});

test("price with лв. suffix → stripped and parsed", () => {
  assert.equal(parseBgPrice("12,90лв."), 12.9);
});

test("price with internal space before decimal (12 ,90) → parsed", () => {
  assert.equal(parseBgPrice("12 ,90"), 12.9);
});

test("price with BGN suffix and surrounding spaces → parsed", () => {
  assert.equal(parseBgPrice("  12,90 BGN  "), 12.9);
});

test("BGN suffix case-insensitive (bgn) → stripped", () => {
  assert.equal(parseBgPrice("9,50 bgn"), 9.5);
});

test("euro suffix → stripped", () => {
  assert.equal(parseBgPrice("6,39€"), 6.39);
});

test("integer price → parsed", () => {
  assert.equal(parseBgPrice("15"), 15);
});

test("numeric input → returned as-is when non-negative", () => {
  assert.equal(parseBgPrice(12.9), 12.9);
  assert.equal(parseBgPrice(0), 0);
});

test("null → null", () => {
  assert.equal(parseBgPrice(null), null);
});

test("empty string → null", () => {
  assert.equal(parseBgPrice(""), null);
});

test("whitespace-only → null", () => {
  assert.equal(parseBgPrice("   "), null);
});

test("non-numeric string → null", () => {
  assert.equal(parseBgPrice("abc"), null);
});

test("negative number string → null", () => {
  assert.equal(parseBgPrice("-5"), null);
});

test("negative numeric input → null", () => {
  assert.equal(parseBgPrice(-1), null);
});

test("zero price string → 0 (valid, free item)", () => {
  assert.equal(parseBgPrice("0"), 0);
});

test("large valid price → parsed", () => {
  assert.equal(parseBgPrice("1250,00"), 1250);
});
