"use client";

import { useState } from "react";

import { submitKioskFeedback } from "@/lib/kiosk/client-api";
import type {
  KioskScanCopy,
  OverallRating,
  ScreenMode,
  SelectedItem,
} from "@/lib/kiosk/types";

type UseKioskFeedbackSubmitInput = {
  copy: KioskScanCopy;
  restaurantId: string;
  selectedItems: SelectedItem[];
  extractedItems: SelectedItem[];
  itemRatings: Record<string, number>;
  overallRating: OverallRating | null;
  setMode: (mode: ScreenMode) => void;
  setStatusMessage: (message: string | null) => void;
};

export function useKioskFeedbackSubmit({
  copy,
  restaurantId,
  selectedItems,
  extractedItems,
  itemRatings,
  overallRating,
  setMode,
  setStatusMessage,
}: UseKioskFeedbackSubmitInput) {
  const [isSavingFeedback, setIsSavingFeedback] = useState(false);

  async function submitCustomerFeedback() {
    const hasItemRating = Object.keys(itemRatings).length > 0;

    if (!hasItemRating && !overallRating) {
      setStatusMessage(copy.chooseOverall);
      return;
    }

    setIsSavingFeedback(true);
    setStatusMessage(copy.savingFeedback);

    try {
      const response = await submitKioskFeedback({
        restaurantId,
        selectedItems,
        extractedItems,
        itemRatings,
        overallRating,
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

  return {
    isSavingFeedback,
    submitCustomerFeedback,
  };
}
