import assert from "node:assert/strict";
import test from "node:test";

import {
  createReceiptReviewDecisions,
  getManualSelectedItems,
  mapApiReceiptItemsToReceiptMatches,
  mapReceiptMatchesToSelectedItems,
  mapReceiptReviewDecisionsToSelectedItems,
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
    name: "Shopska salata",
    category: "Salati",
    price: 8.5,
    imageUrl: "https://example.com/salad.jpg",
    description: "Domati, krastavitsi i sirene.",
  },
  {
    id: "dish-kebapche",
    name: "Kebapche",
    category: "Skara",
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
      name: "Shopska salata",
      quantity: 1,
      imageUrl: "https://example.com/salad.jpg",
      description: "Domati, krastavitsi i sirene.",
    },
  ]);
});

test("receipt mapped items preserve image and description", () => {
  const receiptItems: ReceiptItem[] = [
    {
      raw_text: "Kebapche",
      menu_item_id: "dish-kebapche",
      menu_item_name: "Kebapche",
      quantity: 2,
      matched_via: "fuzzy_match",
    },
    {
      raw_text: "Kebapche",
      menu_item_id: "dish-kebapche",
      menu_item_name: "Kebapche",
      quantity: 1,
      matched_via: "alias",
    },
  ];

  assert.deepEqual(mapReceiptItems(receiptItems, menuItems), [
    {
      id: "dish-kebapche",
      name: "Kebapche",
      quantity: 3,
      imageUrl: null,
      description: null,
    },
  ]);
});

test("receipt match mapping preserves raw text and match source", () => {
  const receiptItems: ReceiptItem[] = [
    {
      raw_text: "PK x2",
      menu_item_id: "dish-kebapche",
      menu_item_name: "Kebapche",
      quantity: 2,
      matched_via: "alias",
    },
    {
      raw_text: "???",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 1,
      matched_via: "unknown",
    },
  ];

  assert.deepEqual(mapApiReceiptItemsToReceiptMatches(receiptItems), [
    {
      rawText: "PK x2",
      menuItemId: "dish-kebapche",
      menuItemName: "Kebapche",
      quantity: 2,
      matchedVia: "alias",
    },
    {
      rawText: "???",
      menuItemId: null,
      menuItemName: null,
      quantity: 1,
      matchedVia: "unknown",
    },
  ]);
});

test("unknown receipt rows are not silently selected as menu items", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "Unknown row",
      menu_item_id: "dish-salad",
      menu_item_name: "Shopska salata",
      quantity: 1,
      matched_via: "unknown",
    },
  ]);

  assert.deepEqual(mapReceiptMatchesToSelectedItems(matches, menuItems), []);
});

test("matched receipt rows still become selected items", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "SHOP",
      menu_item_id: "dish-salad",
      menu_item_name: "Shopska salata",
      quantity: 2,
      matched_via: "fuzzy_match",
    },
  ]);

  assert.deepEqual(mapReceiptMatchesToSelectedItems(matches, menuItems), [
    {
      id: "dish-salad",
      name: "Shopska salata",
      quantity: 2,
      imageUrl: "https://example.com/salad.jpg",
      description: "Domati, krastavitsi i sirene.",
    },
  ]);
});

test("receipt review defaults keep matches and ignore unknown rows", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "SHOP",
      menu_item_id: "dish-salad",
      menu_item_name: "Shopska salata",
      quantity: 1,
      matched_via: "fuzzy_match",
    },
    {
      raw_text: "Unknown row",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 1,
      matched_via: "unknown",
    },
  ]);

  assert.deepEqual(createReceiptReviewDecisions(matches), [
    {
      rowIndex: 0,
      menuItemId: "dish-salad",
      ignored: false,
      learnable: false,
    },
    {
      rowIndex: 1,
      menuItemId: null,
      ignored: true,
      learnable: false,
    },
  ]);
});

test("receipt review can change a matched row before customer rating", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "SHOP",
      menu_item_id: "dish-salad",
      menu_item_name: "Shopska salata",
      quantity: 2,
      matched_via: "fuzzy_match",
    },
  ]);

  assert.deepEqual(
    mapReceiptReviewDecisionsToSelectedItems(
      matches,
      [
        {
          rowIndex: 0,
          menuItemId: "dish-kebapche",
          ignored: false,
          learnable: true,
        },
      ],
      menuItems,
    ),
    [
      {
        id: "dish-kebapche",
        name: "Kebapche",
        quantity: 2,
        imageUrl: null,
        description: null,
      },
    ],
  );
});

test("receipt review can select or ignore unknown rows", () => {
  const matches = mapApiReceiptItemsToReceiptMatches([
    {
      raw_text: "Unknown row",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 1,
      matched_via: "unknown",
    },
    {
      raw_text: "Another unknown row",
      menu_item_id: null,
      menu_item_name: null,
      quantity: 3,
      matched_via: "unknown",
    },
  ]);

  assert.deepEqual(
    mapReceiptReviewDecisionsToSelectedItems(
      matches,
      [
        {
          rowIndex: 0,
          menuItemId: "dish-salad",
          ignored: false,
          learnable: true,
        },
        {
          rowIndex: 1,
          menuItemId: null,
          ignored: true,
          learnable: false,
        },
      ],
      menuItems,
    ),
    [
      {
        id: "dish-salad",
        name: "Shopska salata",
        quantity: 1,
        imageUrl: "https://example.com/salad.jpg",
        description: "Domati, krastavitsi i sirene.",
      },
    ],
  );
});

test("feedback items keep the existing feedback API shape", () => {
  const selectedItems: SelectedItem[] = [
    {
      id: "dish-salad",
      name: "Shopska salata",
      quantity: 1,
      imageUrl: "https://example.com/salad.jpg",
      description: "Domati, krastavitsi i sirene.",
    },
  ];

  assert.deepEqual(toFeedbackItems(selectedItems), [
    {
      id: "dish-salad",
      name: "Shopska salata",
      quantity: 1,
    },
  ]);
});
