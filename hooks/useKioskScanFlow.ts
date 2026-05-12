"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";

import {
  filterMenuItems,
  getManualSelectedItems,
  mapReceiptItems,
  toFeedbackItems,
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
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);
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

  function showManualSelection() {
    setMode("manual");
  }

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
      const formData = new FormData();
      formData.append("restaurant_id", restaurant.id);
      formData.append("file", file);

      const response = await fetch("/api/extract-receipt", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json().catch(() => ({}));

      if (response.status === 402) {
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

      if (!response.ok || !Array.isArray(payload.items)) {
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

      const nextExtractedItems = mapReceiptItems(payload.items, menuItems);

      if (payload.usage) {
        setEntitlement((current) => ({
          ...current,
          used: payload.usage.used ?? current.used,
          limit: payload.usage.limit ?? current.limit,
          remaining: payload.usage.remaining ?? current.remaining,
        }));
      }

      if (nextExtractedItems.length === 0) {
        setStatusMessage(copy.scanFailed);
        setMode("manual");
        return;
      }

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

  function continueWithExtractedItems() {
    setSelectedItems(extractedItems);
    setItemRatings({});
    setOverallRating(null);
    setSelectedIds(new Set());
    setStatusMessage(null);
    setMode("ready");
  }

  function setItemRating(itemId: string, rating: number) {
    setItemRatings((current) => ({
      ...current,
      [itemId]: rating,
    }));
  }

  async function submitCustomerFeedback() {
    const hasItemRating = Object.keys(itemRatings).length > 0;

    if (!hasItemRating && !overallRating) {
      setStatusMessage(copy.chooseOverall);
      return;
    }

    setIsSavingFeedback(true);
    setStatusMessage(copy.savingFeedback);

    try {
      const feedbackItems = toFeedbackItems(selectedItems);
      const feedbackExtractedItems = toFeedbackItems(extractedItems);

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          items: feedbackItems,
          ratings: itemRatings,
          comments: {},
          overallRating,
          overallComment: null,
          customerLanguage: "bg",
          extractedItems: feedbackExtractedItems,
        }),
      });

      if (response.status === 402) {
        setStatusMessage(copy.feedbackLimitReached);
        return;
      }

      if (!response.ok) {
        setStatusMessage(copy.feedbackFailed);
        return;
      }

      setStatusMessage(null);
      setMode("thanks");
    } catch {
      setStatusMessage(copy.feedbackFailed);
    } finally {
      setIsSavingFeedback(false);
    }
  }

  function resetFlow() {
    setSelectedIds(new Set());
    setSelectedItems([]);
    setExtractedItems([]);
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
    resetFlow,
    selectedIds,
    selectedItems,
    setQuery,
    setItemRating,
    setOverallRating,
    showCustomerStep: () => setMode("customer"),
    showManualSelection,
    statusMessage,
    submitCustomerFeedback,
    toggleMenuItem,
    continueWithExtractedItems,
    continueWithManualSelection,
  };
}
