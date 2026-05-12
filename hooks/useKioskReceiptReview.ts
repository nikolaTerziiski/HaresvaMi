"use client";

import { useState } from "react";

import {
  createReceiptReviewDecisions,
  getLearnableReceiptAliasMappings,
  ignoreReceiptReviewDecision,
  mapReceiptReviewDecisionsToSelectedItems,
  updateReceiptReviewDecisionMenuItem,
} from "@/lib/kiosk/selection";
import type {
  KioskMenuItem,
  ReceiptMatch,
  ReceiptReviewDecision,
} from "@/lib/kiosk/types";

type UseKioskReceiptReviewInput = {
  menuItems: KioskMenuItem[];
};

export function useKioskReceiptReview({
  menuItems,
}: UseKioskReceiptReviewInput) {
  const [receiptMatches, setReceiptMatches] = useState<ReceiptMatch[]>([]);
  const [receiptReviewDecisions, setReceiptReviewDecisions] = useState<
    ReceiptReviewDecision[]
  >([]);

  function setReviewMatches(nextReceiptMatches: ReceiptMatch[]) {
    setReceiptMatches(nextReceiptMatches);
    setReceiptReviewDecisions(createReceiptReviewDecisions(nextReceiptMatches));
  }

  function setReceiptReviewMenuItem(
    rowIndex: number,
    menuItemId: string | null,
  ) {
    setReceiptReviewDecisions((current) =>
      updateReceiptReviewDecisionMenuItem(
        current,
        receiptMatches,
        rowIndex,
        menuItemId,
      ),
    );
  }

  function ignoreReceiptReviewRow(rowIndex: number) {
    setReceiptReviewDecisions((current) =>
      ignoreReceiptReviewDecision(current, rowIndex),
    );
  }

  function getConfirmedItems() {
    return mapReceiptReviewDecisionsToSelectedItems(
      receiptMatches,
      receiptReviewDecisions,
      menuItems,
    );
  }

  function getLearnableAliases() {
    return getLearnableReceiptAliasMappings(
      receiptMatches,
      receiptReviewDecisions,
    );
  }

  function clearReceiptReview() {
    setReceiptMatches([]);
    setReceiptReviewDecisions([]);
  }

  return {
    clearReceiptReview,
    getConfirmedItems,
    getLearnableAliases,
    ignoreReceiptReviewRow,
    receiptMatches,
    receiptReviewDecisions,
    setReceiptReviewMenuItem,
    setReviewMatches,
  };
}
