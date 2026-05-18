"use client";

import { useState } from "react";

import { KioskExitDialog } from "@/components/kiosk/scan/KioskExitDialog";
import { CustomerPanel } from "@/components/kiosk/scan/CustomerPanel";
import { ExhaustedNotice } from "@/components/kiosk/scan/ExhaustedNotice";
import { ManualPanel } from "@/components/kiosk/scan/ManualPanel";
import { ProcessingOverlay } from "@/components/kiosk/scan/ProcessingOverlay";
import { ReadyPanel } from "@/components/kiosk/scan/ReadyPanel";
import { ReceiptPreview } from "@/components/kiosk/scan/ReceiptPreview";
import { ReviewPanel } from "@/components/kiosk/scan/ReviewPanel";
import { ScanHeader } from "@/components/kiosk/scan/ScanHeader";
import { ScanPanel } from "@/components/kiosk/scan/ScanPanel";
import { StatusMessage } from "@/components/kiosk/scan/StatusMessage";
import { ThanksPanel } from "@/components/kiosk/scan/ThanksPanel";
import { useKioskScanFlow } from "@/hooks/useKioskScanFlow";
import type { KioskScanScreenProps } from "@/lib/kiosk/types";
import { cn } from "@/lib/utils/cn";

export function KioskScanScreen({
  restaurant,
  menuItems,
  initialEntitlement,
  copy,
}: KioskScanScreenProps) {
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const flow = useKioskScanFlow({
    restaurant,
    menuItems,
    initialEntitlement,
    copy,
  });
  const remainingText = `${flow.entitlement.remaining} / ${flow.entitlement.limit} ${copy.remainingScansLabel}`;
  const isCustomerFacing = flow.mode === "customer" || flow.mode === "thanks";
  const audience: "staff" | "customer" | "thanks" =
    flow.mode === "customer"
      ? "customer"
      : flow.mode === "thanks"
        ? "thanks"
        : "staff";

  async function handleExitConfirm() {
    try {
      await fetch("/kiosk/exit", { method: "POST" });
    } catch {
      // proceed even if the request fails; taking the owner home is better than leaving them stuck
    }
    window.location.assign("/");
  }

  return (
    <div
      className={cn(
        "flex min-h-dvh flex-col text-[var(--ink)]",
        isCustomerFacing ? "bg-[var(--paper)]" : "bg-[var(--bg)]",
      )}
    >
      <ScanHeader
        audience={audience}
        entitlement={flow.entitlement}
        exhaustedTitle={copy.exhaustedTitle}
        remainingLabel={copy.remainingScansLabel}
        restaurant={restaurant}
        scanEyebrow={copy.scanEyebrow}
        onExitRequest={() => setExitDialogOpen(true)}
      />

      {isCustomerFacing ? (
        <main className="min-h-0 flex-1 bg-[var(--paper)]">
          {flow.mode === "customer" ? (
            <CustomerPanel
              copy={copy}
              isSaving={flow.isSavingFeedback}
              items={flow.selectedItems}
              itemRatings={flow.itemRatings}
              overallRating={flow.overallRating}
              statusMessage={flow.statusMessage}
              onFinish={flow.submitCustomerFeedback}
              onItemRatingChange={flow.setItemRating}
              onOverallRatingChange={flow.setOverallRating}
            />
          ) : null}

          {flow.mode === "thanks" ? (
            <ThanksPanel copy={copy} onReset={flow.resetFlow} />
          ) : null}
        </main>
      ) : (
        <main className="grid flex-1 grid-cols-[1.05fr_0.95fr] items-stretch gap-0 max-[900px]:grid-cols-1">
          <section className="flex flex-col justify-center border-r border-[var(--rule)] bg-[var(--paper)] px-10 py-10 max-md:px-5">
            <StatusMessage message={flow.statusMessage} />

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
                  onBack={flow.canScan ? flow.showScanSelection : undefined}
                  onContinue={flow.continueWithManualSelection}
                />
              </>
            ) : null}

            {flow.mode === "review" ? (
              <ReviewPanel
                copy={copy}
                decisions={flow.receiptReviewDecisions}
                menuItems={menuItems}
                receiptMatches={flow.receiptMatches}
                onIgnoreRow={flow.ignoreReceiptReviewRow}
                onManual={flow.showManualSelection}
                onMenuItemChange={flow.setReceiptReviewMenuItem}
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
          </section>

          <section className="flex items-center justify-center px-10 py-10 max-md:hidden">
            <ReceiptPreview
              restaurant={restaurant}
              subtitle={
                flow.entitlement.remaining > 0
                  ? copy.subtitle
                  : copy.ownerUpgradeHint
              }
            />
          </section>
        </main>
      )}

      <input
        ref={flow.fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={flow.handleFileChange}
      />

      {flow.isProcessing ? (
        <ProcessingOverlay message={copy.processing} />
      ) : null}

      <KioskExitDialog
        open={exitDialogOpen}
        onOpenChange={setExitDialogOpen}
        onConfirm={handleExitConfirm}
      />
    </div>
  );
}
