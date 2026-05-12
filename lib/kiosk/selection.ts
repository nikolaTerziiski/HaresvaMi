import { normalizeKioskText } from "@/lib/kiosk/format";
import type {
  KioskMenuItem,
  ReceiptItem,
  ReceiptMatch,
  ReceiptReviewDecision,
  SelectedItem,
} from "@/lib/kiosk/types";

export type FeedbackItemPayload = Pick<
  SelectedItem,
  "id" | "name" | "quantity"
>;

export type LearnableReceiptAliasMapping = {
  rawText: string;
  menuItemId: string;
};

export function filterMenuItems(
  menuItems: KioskMenuItem[],
  query: string,
): KioskMenuItem[] {
  const normalizedQuery = normalizeKioskText(query);

  if (!normalizedQuery) return menuItems;

  return menuItems.filter((item) =>
    normalizeKioskText(`${item.name} ${item.category ?? ""}`).includes(
      normalizedQuery,
    ),
  );
}

export function getManualSelectedItems(
  menuItems: KioskMenuItem[],
  selectedIds: Set<string>,
): SelectedItem[] {
  return menuItems
    .filter((item) => selectedIds.has(item.id))
    .map((item) => ({
      id: item.id,
      name: item.name,
      quantity: 1,
      imageUrl: item.imageUrl,
      description: item.description,
    }));
}

export function mapReceiptItems(
  receiptItems: ReceiptItem[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  return mapReceiptMatchesToSelectedItems(
    mapApiReceiptItemsToReceiptMatches(receiptItems),
    menuItems,
  );
}

export function mapApiReceiptItemsToReceiptMatches(
  receiptItems: ReceiptItem[],
): ReceiptMatch[] {
  return receiptItems.map((item) => ({
    rawText: item.raw_text,
    menuItemId: item.menu_item_id,
    menuItemName: item.menu_item_name,
    quantity: item.quantity,
    matchedVia: item.matched_via ?? "unknown",
  }));
}

export function createReceiptReviewDecisions(
  receiptMatches: ReceiptMatch[],
): ReceiptReviewDecision[] {
  return receiptMatches.map((item, index) => ({
    rowIndex: index,
    menuItemId: item.matchedVia === "unknown" ? null : item.menuItemId,
    ignored: item.matchedVia === "unknown",
    learnable: false,
  }));
}

export function updateReceiptReviewDecisionMenuItem(
  decisions: ReceiptReviewDecision[],
  receiptMatches: ReceiptMatch[],
  rowIndex: number,
  menuItemId: string | null,
): ReceiptReviewDecision[] {
  const receiptMatch = receiptMatches[rowIndex];
  const learnable = Boolean(
    menuItemId &&
    (receiptMatch?.matchedVia === "unknown" ||
      menuItemId !== receiptMatch?.menuItemId),
  );

  return decisions.map((decision) =>
    decision.rowIndex === rowIndex
      ? {
          ...decision,
          menuItemId,
          ignored: menuItemId ? false : decision.ignored,
          learnable,
        }
      : decision,
  );
}

export function ignoreReceiptReviewDecision(
  decisions: ReceiptReviewDecision[],
  rowIndex: number,
): ReceiptReviewDecision[] {
  return decisions.map((decision) =>
    decision.rowIndex === rowIndex
      ? {
          ...decision,
          menuItemId: null,
          ignored: true,
          learnable: false,
        }
      : decision,
  );
}

export function getLearnableReceiptAliasMappings(
  receiptMatches: ReceiptMatch[],
  decisions: ReceiptReviewDecision[],
): LearnableReceiptAliasMapping[] {
  const decisionByRow = new Map(
    decisions.map((decision) => [decision.rowIndex, decision]),
  );

  return receiptMatches.flatMap((match, index) => {
    const decision = decisionByRow.get(index);

    if (
      !decision?.learnable ||
      decision.ignored ||
      !decision.menuItemId ||
      match.rawText.trim().length === 0
    ) {
      return [];
    }

    if (
      match.matchedVia === "alias" &&
      decision.menuItemId === match.menuItemId
    ) {
      return [];
    }

    return [
      {
        rawText: match.rawText,
        menuItemId: decision.menuItemId,
      },
    ];
  });
}

export function mapReceiptMatchesToSelectedItems(
  receiptMatches: ReceiptMatch[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  return mapReceiptReviewDecisionsToSelectedItems(
    receiptMatches,
    createReceiptReviewDecisions(receiptMatches),
    menuItems,
  );
}

export function mapReceiptReviewDecisionsToSelectedItems(
  receiptMatches: ReceiptMatch[],
  decisions: ReceiptReviewDecision[],
  menuItems: KioskMenuItem[],
): SelectedItem[] {
  const menuById = new Map(menuItems.map((item) => [item.id, item]));
  const decisionByRow = new Map(
    decisions.map((decision) => [decision.rowIndex, decision]),
  );
  const selectedById = new Map<string, SelectedItem>();

  receiptMatches.forEach((item, index) => {
    const decision = decisionByRow.get(index);
    const menuItemId = decision?.menuItemId ?? null;

    if (decision?.ignored || !menuItemId) return;

    const menuItem = menuById.get(menuItemId);

    if (!menuItem) return;

    const existing = selectedById.get(menuItem.id);
    const quantity = item.quantity > 0 ? item.quantity : 1;

    selectedById.set(menuItem.id, {
      id: menuItem.id,
      name: menuItem.name,
      quantity: (existing?.quantity ?? 0) + quantity,
      imageUrl: menuItem.imageUrl,
      description: menuItem.description,
    });
  });

  return Array.from(selectedById.values());
}

export function toFeedbackItems(
  selectedItems: SelectedItem[],
): FeedbackItemPayload[] {
  return selectedItems.map(({ id, name, quantity }) => ({
    id,
    name,
    quantity,
  }));
}
