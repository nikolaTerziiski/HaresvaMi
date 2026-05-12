import assert from "node:assert/strict";
import test from "node:test";

import {
  getManualSelectedItems,
  mapReceiptItems,
  toFeedbackItems,
} from "@/lib/kiosk/selection";
import type {
  KioskMenuItem,
  ReceiptItem,
  SelectedItem,
} from "@/lib/kiosk/types";

const menuItems: KioskMenuItem[] = [
  {
    id: "dish-salad",
    name: "Шопска салата",
    category: "Салати",
    price: 8.5,
    imageUrl: "https://example.com/salad.jpg",
    description: "Домати, краставици и сирене.",
  },
  {
    id: "dish-kebapche",
    name: "Кебапче",
    category: "Скара",
    price: 3.2,
    imageUrl: null,
    description: null,
  },
];

test("manual selected items preserve image and description", () => {
  const selected = getManualSelectedItems(menuItems, new Set(["dish-salad"]));

  assert.deepEqual(selected, [
    {
      id: "dish-salad",
      name: "Шопска салата",
      quantity: 1,
      imageUrl: "https://example.com/salad.jpg",
      description: "Домати, краставици и сирене.",
    },
  ]);
});

test("receipt mapped items preserve image and description", () => {
  const receiptItems: ReceiptItem[] = [
    {
      raw_text: "Kebapche",
      menu_item_id: "dish-kebapche",
      menu_item_name: "Кебапче",
      quantity: 2,
    },
    {
      raw_text: "Kebapche",
      menu_item_id: "dish-kebapche",
      menu_item_name: "Кебапче",
      quantity: 1,
    },
  ];

  assert.deepEqual(mapReceiptItems(receiptItems, menuItems), [
    {
      id: "dish-kebapche",
      name: "Кебапче",
      quantity: 3,
      imageUrl: null,
      description: null,
    },
  ]);
});

test("feedback items keep the existing feedback API shape", () => {
  const selectedItems: SelectedItem[] = [
    {
      id: "dish-salad",
      name: "Шопска салата",
      quantity: 1,
      imageUrl: "https://example.com/salad.jpg",
      description: "Домати, краставици и сирене.",
    },
  ];

  assert.deepEqual(toFeedbackItems(selectedItems), [
    {
      id: "dish-salad",
      name: "Шопска салата",
      quantity: 1,
    },
  ]);
});
