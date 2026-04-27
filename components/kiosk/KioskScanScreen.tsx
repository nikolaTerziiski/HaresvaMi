"use client";

import { CustomerPanel } from "@/components/kiosk/scan/CustomerPanel";
import { ExhaustedNotice } from "@/components/kiosk/scan/ExhaustedNotice";
import { ManualPanel } from "@/components/kiosk/scan/ManualPanel";
import { ReadyPanel } from "@/components/kiosk/scan/ReadyPanel";
import { ReceiptPreview } from "@/components/kiosk/scan/ReceiptPreview";
import { ReviewPanel } from "@/components/kiosk/scan/ReviewPanel";
import { ScanHeader } from "@/components/kiosk/scan/ScanHeader";
import { ScanPanel } from "@/components/kiosk/scan/ScanPanel";
import { StatusMessage } from "@/components/kiosk/scan/StatusMessage";
import { ThanksPanel } from "@/components/kiosk/scan/ThanksPanel";
import { useKioskScanFlow } from "@/hooks/useKioskScanFlow";
import type { KioskScanScreenProps } from "@/lib/kiosk/types";

export function KioskScanScreen({
  restaurant,
  menuItems,
  initialEntitlement,
  copy,
}: KioskScanScreenProps) {
  const flow = useKioskScanFlow({
    restaurant,
    menuItems,
    initialEntitlement,
    copy,
  });
  const remainingText = `${flow.entitlement.remaining} / ${flow.entitlement.limit} ${copy.remainingScansLabel}`;

  return (
    <div className="flex min-h-dvh flex-col px-8 py-7 text-[var(--ink)] max-md:px-5">
      <ScanHeader
        entitlement={flow.entitlement}
        exhaustedTitle={copy.exhaustedTitle}
        remainingLabel={copy.remainingScansLabel}
        restaurant={restaurant}
        scanEyebrow={copy.scanEyebrow}
      />

      <section className="grid flex-1 grid-cols-[1.05fr_0.95fr] items-center gap-8 py-10 max-[900px]:grid-cols-1">
        <div>
          {flow.mode === "scan" ? (
            <ScanPanel
              canScan={flow.canScan}
              copy={copy}
              isProcessing={flow.isProcessing}
              remainingText={remainingText}
              onManual={flow.showManualSelection}
              onScan={flow.openCamera}
            />
          ) : null}

          {flow.mode === "manual" ? (
            <>
              {flow.entitlement.remaining <= 0 ? (
                <ExhaustedNotice copy={copy} />
              ) : null}
              <ManualPanel
                copy={copy}
                filteredMenuItems={flow.filteredMenuItems}
                menuItems={menuItems}
                query={flow.query}
                selectedCount={flow.manualSelectedItems.length}
                selectedIds={flow.selectedIds}
                setQuery={flow.setQuery}
                toggleMenuItem={flow.toggleMenuItem}
                onContinue={flow.continueWithManualSelection}
              />
            </>
          ) : null}

          {flow.mode === "review" ? (
            <ReviewPanel
              copy={copy}
              items={flow.extractedItems}
              onManual={flow.showManualSelection}
              onUseExtracted={flow.continueWithExtractedItems}
            />
          ) : null}

          {flow.mode === "ready" ? (
            <ReadyPanel
              copy={copy}
              items={flow.selectedItems}
              onEdit={flow.showManualSelection}
              onStartCustomerStep={flow.showCustomerStep}
            />
          ) : null}

          {flow.mode === "customer" ? (
            <CustomerPanel
              copy={copy}
              isSaving={flow.isSavingFeedback}
              items={flow.selectedItems}
              itemRatings={flow.itemRatings}
              overallRating={flow.overallRating}
              onFinish={flow.submitCustomerFeedback}
              onItemRatingChange={flow.setItemRating}
              onOverallRatingChange={flow.setOverallRating}
            />
          ) : null}

          {flow.mode === "thanks" ? (
            <ThanksPanel copy={copy} onReset={flow.resetFlow} />
          ) : null}

          <StatusMessage message={flow.statusMessage} />
        </div>

        <ReceiptPreview
          restaurant={restaurant}
          subtitle={
            flow.entitlement.remaining > 0
              ? copy.subtitle
              : copy.ownerUpgradeHint
          }
        />
      </section>

      <input
        ref={flow.fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={flow.handleFileChange}
      />
    </div>
  );
}
