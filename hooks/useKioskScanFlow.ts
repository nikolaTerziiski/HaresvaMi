"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";

import { useKioskFeedbackSubmit } from "@/hooks/useKioskFeedbackSubmit";
import { useKioskReceiptReview } from "@/hooks/useKioskReceiptReview";
import {
  extractReceiptForKiosk,
  learnReceiptAliasesForKiosk,
} from "@/lib/kiosk/client-api";
import {
  filterMenuItems,
  getManualSelectedItems,
  mapApiReceiptItemsToReceiptMatches,
  mapReceiptMatchesToSelectedItems,
} from "@/lib/kiosk/selection";
import type {
  EntitlementResult,
  KioskMenuItem,
  KioskRestaurant,
  KioskScanCopy,
  OverallRating,
  ScreenMode,
  SelectedItem,
} from "@/lib/kiosk/types";

type UseKioskScanFlowInput = {
  restaurant: KioskRestaurant;
  menuItems: KioskMenuItem[];
  initialEntitlement: EntitlementResult;
  copy: KioskScanCopy;
};

export function useKioskScanFlow({
  restaurant,
  menuItems,
  initialEntitlement,
  copy,
}: UseKioskScanFlowInput) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [entitlement, setEntitlement] = useState(initialEntitlement);
  const [mode, setMode] = useState<ScreenMode>(
    initialEntitlement.remaining > 0 ? "scan" : "manual",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [extractedItems, setExtractedItems] = useState<SelectedItem[]>([]);
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [overallRating, setOverallRating] = useState<OverallRating | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const canScan = entitlement.remaining > 0 && menuItems.length > 0;
  const filteredMenuItems = useMemo(
    () => filterMenuItems(menuItems, query),
    [menuItems, query],
  );
  const manualSelectedItems = useMemo(
    () => getManualSelectedItems(menuItems, selectedIds),
    [menuItems, selectedIds],
  );
  const receiptReview = useKioskReceiptReview({ menuItems });
  const { isSavingFeedback, submitCustomerFeedback } = useKioskFeedbackSubmit({
    copy,
    restaurantId: restaurant.id,
    selectedItems,
    extractedItems,
    itemRatings,
    overallRating,
    setMode,
    setStatusMessage,
  });

  function openCamera() {
    if (!canScan || isProcessing) {
      setMode("manual");
      return;
    }

    fileInputRef.current?.click();
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setIsProcessing(true);
    setStatusMessage(copy.processing);

    try {
      const { ok, payload, status } = await extractReceiptForKiosk(
        restaurant.id,
        file,
      );

      if (status === 402) {
        setEntitlement({
          allowed: false,
          reason: payload.reason ?? "scan_limit_reached",
          used: payload.used ?? entitlement.used,
          limit: payload.limit ?? entitlement.limit,
          remaining: payload.remaining ?? 0,
          upgradeTarget: payload.upgradeTarget ?? entitlement.upgradeTarget,
        });
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      if (!ok || !Array.isArray(payload.items)) {
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      const nextReceiptMatches = mapApiReceiptItemsToReceiptMatches(
        payload.items,
      );
      const nextExtractedItems = mapReceiptMatchesToSelectedItems(
        nextReceiptMatches,
        menuItems,
      );

      if (payload.usage) {
        setEntitlement((current) => ({
          ...current,
          used: payload.usage.used ?? current.used,
          limit: payload.usage.limit ?? current.limit,
          remaining: payload.usage.remaining ?? current.remaining,
        }));
      }

      if (nextReceiptMatches.length === 0) {
        receiptReview.setReviewMatches(nextReceiptMatches);
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      receiptReview.setReviewMatches(nextReceiptMatches);
      setExtractedItems(nextExtractedItems);
      setStatusMessage(null);
      setMode("review");
    } catch {
      setStatusMessage(copy.scanFailed);
      setMode("manual");
    } finally {
      setIsProcessing(false);
    }
  }

  function toggleMenuItem(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  }

  function continueWithManualSelection() {
    if (manualSelectedItems.length === 0) {
      setStatusMessage(copy.chooseAtLeastOne);
      return;
    }

    setSelectedItems(manualSelectedItems);
    setItemRatings({});
    setOverallRating(null);
    setStatusMessage(null);
    setMode("ready");
  }

  async function continueWithExtractedItems() {
    const confirmedItems = receiptReview.getConfirmedItems();

    if (confirmedItems.length === 0) {
      setStatusMessage(copy.chooseAtLeastOne);
      return;
    }

    let nextStatusMessage: string | null = null;
    const learnableAliases = receiptReview.getLearnableAliases();

    if (learnableAliases.length > 0) {
      try {
        const response = await learnReceiptAliasesForKiosk(learnableAliases);

        if (!response.ok) {
          nextStatusMessage =
            "Не успяхме да запазим някои съкращения. Оценяването може да продължи.";
        }
      } catch {
        nextStatusMessage =
          "Не успяхме да запазим някои съкращения. Оценяването може да продължи.";
      }
    }

    setSelectedItems(confirmedItems);
    setExtractedItems(confirmedItems);
    setItemRatings({});
    setOverallRating(null);
    setSelectedIds(new Set());
    receiptReview.clearReceiptReview();
    setStatusMessage(nextStatusMessage);
    setMode("ready");
  }

  function setItemRating(itemId: string, rating: number) {
    setItemRatings((current) => {
      if (current[itemId] === rating) {
        const next = { ...current };
        delete next[itemId];

        return next;
      }

      return {
        ...current,
        [itemId]: rating,
      };
    });
  }

  function toggleOverallRating(rating: OverallRating) {
    setOverallRating((current) => (current === rating ? null : rating));
  }

  function resetFlow() {
    setSelectedIds(new Set());
    setSelectedItems([]);
    setExtractedItems([]);
    receiptReview.clearReceiptReview();
    setItemRatings({});
    setOverallRating(null);
    setQuery("");
    setStatusMessage(null);
    setMode(entitlement.remaining > 0 ? "scan" : "manual");
  }

  return {
    canScan,
    entitlement,
    extractedItems,
    fileInputRef,
    filteredMenuItems,
    handleFileChange,
    isProcessing,
    isSavingFeedback,
    itemRatings,
    manualSelectedItems,
    mode,
    openCamera,
    overallRating,
    query,
    receiptMatches: receiptReview.receiptMatches,
    receiptReviewDecisions: receiptReview.receiptReviewDecisions,
    resetFlow,
    selectedIds,
    selectedItems,
    setQuery,
    setItemRating,
    setOverallRating: toggleOverallRating,
    showCustomerStep: () => setMode("customer"),
    showManualSelection: () => setMode("manual"),
    statusMessage,
    submitCustomerFeedback,
    toggleMenuItem,
    continueWithExtractedItems,
    continueWithManualSelection,
    ignoreReceiptReviewRow: receiptReview.ignoreReceiptReviewRow,
    setReceiptReviewMenuItem: receiptReview.setReceiptReviewMenuItem,
  };
}
