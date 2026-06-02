"use client";

import { useEffect } from "react";

import { RecoveryForm } from "@/components/kiosk/scan/RecoveryForm";
import type { KioskScanCopy } from "@/lib/kiosk/types";
import type { Sentiment } from "@/lib/feedback/sentiment";
import { submitRecoveryComment } from "@/lib/kiosk/client-api";

type ReputationPanelProps = {
  copy: KioskScanCopy;
  restaurantId: string;
  sentiment: Sentiment | null;
  sessionId: string | null;
  onDone: () => void;
};

export function ReputationPanel({
  copy,
  restaurantId,
  sentiment,
  sessionId,
  onDone,
}: ReputationPanelProps) {
  const isUnhappy = sentiment === "unhappy";

  // Defensive: if sentiment is not unhappy, skip straight to thanks
  useEffect(() => {
    if (!isUnhappy) {
      onDone();
    }
  }, [isUnhappy, onDone]);

  if (!isUnhappy) {
    return null;
  }

  return (
    <RecoveryForm
      copy={copy}
      restaurantId={restaurantId}
      sessionId={sessionId}
      onDone={onDone}
      submitRecoveryComment={submitRecoveryComment}
    />
  );
}
