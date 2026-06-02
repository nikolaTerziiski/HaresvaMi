import assert from "node:assert/strict";
import test from "node:test";

import type { MenuItemRow } from "@/lib/menu/types";
import { validateRows } from "@/lib/menu/validation";
import { buildMenuValidationSummary } from "@/lib/menu/validation-summary";

const validationMessages = {
  nameRequired: "Добави име на продукта.",
  priceRequired: "Добави цена на продукта.",
  invalidPrice: "Цената трябва да е число.",
  duplicateName: "Този продукт вече е добавен.",
};

const summaryCopy = {
  uncategorizedCategory: "без категория",
  needOneItem: "Добави поне един продукт, за да запазиш менюто.",
  emptyCategory: (category: string) =>
    `В категория „${category}“ не сте попълнили ястие.`,
  missingName: (category: string) =>
    `В категория „${category}“ има продукт без име.`,
  missingPrice: (category: string, dish: string) =>
    `В категория „${category}“ за ястие „${dish}“ не сте попълнили цена.`,
  invalidPrice: (category: string) =>
    `В категория „${category}“ има продукт с невалидна цена.`,
  duplicateProducts: (names: string) => `Има повтарящи се продукти: ${names}.`,
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

function summary(rows: MenuItemRow[]) {
  return buildMenuValidationSummary({
    rows,
    validation: validateRows(rows, validationMessages),
    copy: summaryCopy,
  });
}

test("menu validation summary reports empty category draft rows", () => {
  assert.deepEqual(summary([row({ category: "Основни" })]), [
    "В категория „Основни“ не сте попълнили ястие.",
  ]);
});

test("menu validation summary reports missing product names by category", () => {
  assert.deepEqual(summary([row({ category: "Салати", price: "6,90" })]), [
    "В категория „Салати“ има продукт без име.",
  ]);
});

test("menu validation summary reports invalid prices by category", () => {
  assert.deepEqual(
    summary([row({ category: "Напитки", name_bg: "Айрян", price: "много" })]),
    ["В категория „Напитки“ има продукт с невалидна цена."],
  );
});

test("menu validation summary reports missing prices by category and dish", () => {
  assert.deepEqual(summary([row({ category: "Салати", name_bg: "Кебапче" })]), [
    "В категория „Салати“ за ястие „Кебапче“ не сте попълнили цена.",
  ]);
});

test("menu validation summary reports duplicate product names", () => {
  assert.deepEqual(
    summary([
      row({ id: "first", category: "Скара", name_bg: "Кебапче", price: "3" }),
      row({
        id: "second",
        category: "Основни",
        name_bg: " кебапче ",
        price: "3,50",
      }),
    ]),
    ["Има повтарящи се продукти: „Кебапче“."],
  );
});

test("menu validation summary returns no messages for a valid menu", () => {
  assert.deepEqual(
    summary([row({ category: "Супи", name_bg: "Таратор", price: "4,50" })]),
    [],
  );
});
