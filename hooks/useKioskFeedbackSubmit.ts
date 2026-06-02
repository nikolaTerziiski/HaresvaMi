"use client";

import { useState } from "react";

import { submitKioskFeedback } from "@/lib/kiosk/client-api";
import { classifyFeedbackSentiment } from "@/lib/feedback/sentiment";
import type { Sentiment } from "@/lib/feedback/sentiment";
import type {
  KioskScanCopy,
  OverallRating,
  ScreenMode,
  SelectedItem,
} from "@/lib/kiosk/types";

type UseKioskFeedbackSubmitInput = {
  copy: KioskScanCopy;
  restaurantId: string;
  reputationEnabled: boolean;
  selectedItems: SelectedItem[];
  extractedItems: SelectedItem[];
  itemRatings: Record<string, number>;
  overallRating: OverallRating | null;
  setMode: (mode: ScreenMode) => void;
  setStatusMessage: (message: string | null) => void;
  setSentiment: (sentiment: Sentiment | null) => void;
  setSessionId: (sessionId: string | null) => void;
};

export function useKioskFeedbackSubmit({
  copy,
  restaurantId,
  reputationEnabled,
  selectedItems,
  extractedItems,
  itemRatings,
  overallRating,
  setMode,
  setStatusMessage,
  setSentiment,
  setSessionId,
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

      const sentiment = classifyFeedbackSentiment(
        overallRating,
        Object.values(itemRatings),
      );

      setSentiment(sentiment);
      setSessionId(response.sessionId);
      setStatusMessage(null);
      setMode(
        reputationEnabled && sentiment === "unhappy" ? "reputation" : "thanks",
      );
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
