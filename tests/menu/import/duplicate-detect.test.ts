import assert from "node:assert/strict";
import test from "node:test";

import { findDuplicate } from "@/lib/menu/duplicate-detect";

function existing(
  entries: { id: string; name_bg: string }[],
): { id: string; name_bg: string }[] {
  return entries;
}

test("identical names → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопска салата" },
    existing([{ id: "1", name_bg: "Шопска салата" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "1");
});

test("prefix variant (Шопска vs Шопска салата) → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопска" },
    existing([{ id: "2", name_bg: "Шопска салата" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "2");
});

test("prefix variant reversed (Шопска салата vs Шопска) → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопска салата" },
    existing([{ id: "3", name_bg: "Шопска" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "3");
});

test("parenthetical (Кебапче (250г) vs Кебапче) → match", () => {
  const result = findDuplicate(
    { name_bg: "Кебапче (250г)" },
    existing([{ id: "4", name_bg: "Кебапче" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "4");
});

test("case + whitespace (  ШОПСКА   vs шопска) → match", () => {
  const result = findDuplicate(
    { name_bg: "  ШОПСКА  " },
    existing([{ id: "5", name_bg: "шопска" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "5");
});

test("diacritics (Шопскá vs Шопска) → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопскá" },
    existing([{ id: "6", name_bg: "Шопска" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "6");
});

test("Levenshtein 1 (Шопскo vs Шопска) → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопскo" },
    existing([{ id: "7", name_bg: "Шопска" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "7");
});

test("Levenshtein 2 (Шопскоо vs Шопска) → match", () => {
  const result = findDuplicate(
    { name_bg: "Шопскоо" },
    existing([{ id: "8", name_bg: "Шопска" }]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "8");
});

test("distant names (Шопска vs Боб чорба) → no match", () => {
  const result = findDuplicate(
    { name_bg: "Шопска" },
    existing([{ id: "9", name_bg: "Боб чорба" }]),
  );
  assert.equal(result, null);
});

test("empty existing list → no match", () => {
  const result = findDuplicate({ name_bg: "Шопска" }, []);
  assert.equal(result, null);
});

test("min-length 4 for prefix: Бо vs Боб чорба → no prefix match (Levenshtein decides)", () => {
  // "бо" length is 2 < 4, so prefix rule doesn't apply.
  // Levenshtein("бо", "боб чорба") is large → no match
  const result = findDuplicate(
    { name_bg: "Бо" },
    existing([{ id: "10", name_bg: "Боб чорба" }]),
  );
  assert.equal(result, null);
});

test("first match wins when multiple existing items match", () => {
  const result = findDuplicate(
    { name_bg: "Шопска" },
    existing([
      { id: "a", name_bg: "Шопска" },
      { id: "b", name_bg: "Шопска" },
    ]),
  );
  assert.ok(result !== null);
  assert.equal(result.id, "a");
});
