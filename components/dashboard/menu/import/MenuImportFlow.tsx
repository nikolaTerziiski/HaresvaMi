"use client";

import type { EntitlementResult } from "@/lib/billing/entitlements-core";
import { useMenuImportFlow } from "@/hooks/useMenuImportFlow";

import { ImportProcessingStep } from "./ImportProcessingStep";
import { ImportReviewStepPlaceholder } from "./ImportReviewStepPlaceholder";
import { ImportStepper } from "./ImportStepper";
import { ImportUploadStep } from "./ImportUploadStep";
import { MenuTierLockedCard } from "./MenuTierLockedCard";

type ExistingItem = {
  id: string;
  name_bg: string;
  category: string;
};

type MenuImportFlowProps = {
  restaurantId: string;
  restaurantName: string;
  entitlement: EntitlementResult;
  existingItems: ExistingItem[];
};

export function MenuImportFlow({
  restaurantId,
  restaurantName: _restaurantName,
  entitlement,
  existingItems,
}: MenuImportFlowProps) {
  const {
    state,
    addFiles,
    removeFile,
    startExtraction,
    cancelProcessing,
    discard,
  } = useMenuImportFlow({ restaurantId, entitlement, existingItems });

  const { mode, files, result, error } = state;

  const stepperStep: 1 | 2 | 3 =
    mode === "upload" || mode === "tier_locked"
      ? 1
      : mode === "processing"
        ? 2
        : 3;

  return (
    <div className="w-full px-10 py-10 pb-20 max-md:px-6 max-md:py-8">
      <ImportStepper current={stepperStep} />

      {mode === "tier_locked" && (
        <MenuTierLockedCard entitlement={entitlement} />
      )}

      {mode === "upload" && (
        <ImportUploadStep
          files={files}
          error={error}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onStart={startExtraction}
        />
      )}

      {mode === "processing" && (
        <ImportProcessingStep files={files} onCancel={cancelProcessing} />
      )}

      {(mode === "review" || mode === "saving") && result && (
        <ImportReviewStepPlaceholder result={result} onDiscard={discard} />
      )}
    </div>
  );
}
