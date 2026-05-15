import assert from "node:assert/strict";
import test from "node:test";

import { bgnToEur, formatBgn, formatEur } from "@/lib/menu/currency";
import {
  categoryKey,
  createEmptyRow,
  createRowsFromInitialItems,
  formatPrice,
  getDirtyRows,
  parsePrice,
  rowsDifferFromInitial,
} from "@/lib/menu/format";
import { buildCategoryFilters, buildGroupedItems } from "@/lib/menu/grouping";
import type { InitialMenuItem, MenuItemRow } from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";

const validationMessages = {
  nameRequired: "Name is required",
  invalidPrice: "Invalid price",
  duplicateName: "Duplicate name",
};

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

test("currency helpers keep BGN as source and derive EUR with fixed ratio", () => {
  assert.equal(bgnToEur(19.5583), 10);
  assert.equal(formatBgn(6.9), "6.90");
  assert.equal(formatEur(bgnToEur(12.5)), "6.39");
});

test("menu prices accept comma decimals and a BGN suffix", () => {
  assert.deepEqual(parsePrice(` 12,50 \u043b\u0432. `), {
    value: 12.5,
    valid: true,
  });
  assert.deepEqual(parsePrice(""), { value: null, valid: true });
  assert.deepEqual(parsePrice("12.555"), { value: null, valid: false });
  assert.deepEqual(parsePrice("1000000"), { value: null, valid: false });
});

test("menu row validation trims values and skips untouched new rows", () => {
  const result = validateRows(
    [
      row({ id: "blank" }),
      row({
        id: "valid",
        name_bg: "  Shopska   salad ",
        category: " Salads ",
        price: "6,90",
        description_bg: " Fresh   tomatoes ",
      }),
    ],
    validationMessages,
  );

  assert.equal(result.hasErrors, false);
  assert.deepEqual(result.rowErrors, {});
  assert.deepEqual(result.validItems, [
    {
      persistedId: undefined,
      name_bg: "Shopska salad",
      category: "Salads",
      price: 6.9,
      description_bg: "Fresh tomatoes",
    },
  ]);
});

test("menu row validation marks both duplicate rows", () => {
  const result = validateRows(
    [
      row({ id: "first", name_bg: "Kebapche", price: "3.20" }),
      row({ id: "second", name_bg: " kebapche ", price: "4" }),
    ],
    validationMessages,
  );

  assert.equal(result.hasErrors, true);
  assert.equal(result.rowErrors.first.name_bg, "Duplicate name");
  assert.equal(result.rowErrors.second.name_bg, "Duplicate name");
});

test("menu row validation blocks invalid edited rows", () => {
  const result = validateRows(
    [
      row({ id: "missing-name", category: "Grill", price: "5" }),
      row({ id: "bad-price", name_bg: "Soup", price: "12.999" }),
    ],
    validationMessages,
  );

  assert.equal(result.hasErrors, true);
  assert.equal(result.rowErrors["missing-name"].name_bg, "Name is required");
  assert.equal(result.rowErrors["bad-price"].price, "Invalid price");
});

test("category filters count non-empty rows and merge category keys", () => {
  const filters = buildCategoryFilters([
    row({ id: "1", name_bg: "Kebapche", category: "Grill" }),
    row({ id: "2", name_bg: "Kyufte", category: " grill " }),
    row({ id: "3", name_bg: "Salad", category: "Salads" }),
    row({ id: "blank" }),
  ]);

  assert.deepEqual(
    filters.map(({ key, displayName, count }) => ({
      key,
      displayName,
      count,
    })),
    [
      { key: "grill", displayName: "Grill", count: 2 },
      { key: "salads", displayName: "Salads", count: 1 },
    ],
  );
});

test("grouped menu items support category filters and Bulgarian-aware search", () => {
  const items = [
    row({ id: "1", name_bg: "Kebapche", category: "Grill" }),
    row({ id: "2", name_bg: "Shopska salad", category: "Salads" }),
    row({ id: "3", name_bg: "Tarator", category: "Soups" }),
  ];

  assert.deepEqual(
    buildGroupedItems({
      items,
      searchQuery: "salad",
      selectedCategoryKeys: null,
    }).map((group) => group.items.map((item) => item.id)),
    [["2"]],
  );

  assert.deepEqual(
    buildGroupedItems({
      items,
      searchQuery: "",
      selectedCategoryKeys: [categoryKey("Grill")],
    }).map((group) => group.items.map((item) => item.id)),
    [["1"]],
  );
});

test("row diffs ignore untouched blanks but catch real menu changes", () => {
  const initial: InitialMenuItem[] = [
    {
      id: "item-1",
      name_bg: "Kebapche",
      category: "Grill",
      price: 3.2,
      description_bg: null,
      sort_order: 0,
    },
  ];
  const rows = createRowsFromInitialItems(initial);

  assert.equal(formatPrice(3), "3");
  assert.equal(formatPrice(3.2), "3.20");
  assert.equal(
    rowsDifferFromInitial([...rows, row({ id: "blank" })], initial),
    false,
  );
  assert.equal(
    rowsDifferFromInitial(
      [...rows, row({ id: "new", name_bg: "Soup" })],
      initial,
    ),
    true,
  );
  assert.equal(
    rowsDifferFromInitial([{ ...rows[0], price: "3.50" }], initial),
    true,
  );
});

test("getDirtyRows returns only rows that differ from baseline or are new non-blank rows", () => {
  const initial: InitialMenuItem[] = [
    {
      id: "item-1",
      name_bg: "Kebapche",
      category: "Grill",
      price: 3.2,
      description_bg: null,
      sort_order: 0,
    },
    {
      id: "item-2",
      name_bg: "Salad",
      category: "Salads",
      price: 6.9,
      description_bg: null,
      sort_order: 1,
    },
  ];
  const rows = createRowsFromInitialItems(initial);

  // No changes — no dirty rows
  assert.equal(getDirtyRows(rows, initial).length, 0);

  // Blank new row is not dirty
  const withBlank = [...rows, row({ id: "blank" })];
  assert.equal(getDirtyRows(withBlank, initial).length, 0);

  // Non-blank new row is dirty
  const withNew = [...rows, row({ id: "new1", name_bg: "Soup", category: "Soups", price: "4" })];
  assert.equal(getDirtyRows(withNew, initial).length, 1);
  assert.equal(getDirtyRows(withNew, initial)[0].id, "new1");

  // Edited persisted row is dirty
  const edited = rows.map((r) =>
    r.id === "item-1" ? { ...r, price: "5.00" } : r,
  );
  const dirtyEdited = getDirtyRows(edited, initial);
  assert.equal(dirtyEdited.length, 1);
  assert.equal(dirtyEdited[0].id, "item-1");

  // Both edited + new → two dirty rows
  const both = [
    ...edited,
    row({ id: "new2", name_bg: "Tarator", category: "Soups", price: "3" }),
  ];
  assert.equal(getDirtyRows(both, initial).length, 2);
});

test("handleManualStart logic: one empty row per category, correct category assigned", () => {
  // Simulates what handleManualStart does: map categories to createEmptyRow(cat)
  const categories = ["Салати", "Супи", "Основни"];
  const newRows = categories
    .map((cat) => cat.trim())
    .filter(Boolean)
    .map((cat) => createEmptyRow(cat));

  assert.equal(newRows.length, 3);
  assert.equal(newRows[0].category, "Салати");
  assert.equal(newRows[1].category, "Супи");
  assert.equal(newRows[2].category, "Основни");

  // Each row must be blank (no name/price/description)
  for (const row of newRows) {
    assert.equal(row.name_bg, "");
    assert.equal(row.price, "");
    assert.equal(row.description_bg, "");
    assert.equal(typeof row.id, "string");
    assert.ok(row.id.length > 0);
  }

  // Degenerate: empty/whitespace categories are filtered out
  const degenRows = ["", "  ", "Десерти"]
    .map((cat) => cat.trim())
    .filter(Boolean)
    .map((cat) => createEmptyRow(cat));

  assert.equal(degenRows.length, 1);
  assert.equal(degenRows[0].category, "Десерти");
});
