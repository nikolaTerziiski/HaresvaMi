import assert from "node:assert/strict";
import test from "node:test";

import {
  getProtectedManualStarterCategories,
  reconcileManualCategoryRows,
} from "@/lib/menu/manual-categories";
import type { MenuItemRow } from "@/lib/menu/types";

function row(overrides: Partial<MenuItemRow>): MenuItemRow {
  return {
    id: "row",
    name_bg: "",
    category: "",
    price: "",
    description_bg: "",
    ...overrides,
  };
}

test("manual category reconciliation preserves rows with entered dish data", () => {
  const result = reconcileManualCategoryRows(
    [
      row({ id: "main", category: "Основни", name_bg: "Кебапче" }),
      row({ id: "empty-soup", category: "Супи" }),
    ],
    ["Салати"],
  );

  assert.deepEqual(
    result.rows.map((item) => item.id),
    ["main", result.addedRowIds[0]],
  );
  assert.deepEqual(result.selectedCategories, ["Салати", "Основни"]);
});

test("manual category reconciliation removes deselected empty draft rows", () => {
  const result = reconcileManualCategoryRows(
    [
      row({ id: "salads", category: "Салати" }),
      row({ id: "soups", category: "Супи" }),
    ],
    ["Салати"],
  );

  assert.deepEqual(
    result.rows.map((item) => item.id),
    ["salads"],
  );
});

test("manual category reconciliation adds empty rows for newly selected categories", () => {
  const result = reconcileManualCategoryRows(
    [row({ id: "salads", category: "Салати" })],
    ["Салати", "Десерти"],
  );

  assert.equal(result.rows.length, 2);
  assert.equal(result.rows[1].category, "Десерти");
  assert.equal(result.rows[1].name_bg, "");
  assert.deepEqual(result.addedRowIds, [result.rows[1].id]);
});

test("manual category reconciliation keeps protected categories selected", () => {
  const rows = [row({ id: "main", category: "Основни", price: "2,50" })];
  const result = reconcileManualCategoryRows(rows, []);

  assert.deepEqual(getProtectedManualStarterCategories(rows), ["Основни"]);
  assert.deepEqual(result.protectedCategories, ["Основни"]);
  assert.deepEqual(result.selectedCategories, ["Основни"]);
  assert.deepEqual(result.rows, rows);
});
