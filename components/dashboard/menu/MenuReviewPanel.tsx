"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { MenuCategoryDetail } from "@/components/dashboard/menu/MenuCategoryDetail";
import { MenuCategoryRail } from "@/components/dashboard/menu/MenuCategoryRail";
import { MenuSaveBanner } from "@/components/dashboard/menu/MenuSaveBanner";
import { MenuStartOverDialog } from "@/components/dashboard/menu/MenuStartOverDialog";
import { MenuUnsavedBar } from "@/components/dashboard/menu/MenuUnsavedBar";
import { MenuValidationDialog } from "@/components/dashboard/menu/MenuValidationDialog";
import type { MenuManagerFlow } from "@/hooks/useMenuManagerFlow";
import { categoryKey } from "@/lib/menu/format";

type MenuReviewPanelProps = {
  flow: MenuManagerFlow;
};

/**
 * Master-detail menu review panel.
 *
 * Left pane: MenuCategoryRail — category list (or horizontal chips on mobile).
 * Right pane: MenuCategoryDetail — dish rows + slide-over dish editor.
 *
 * All edits accumulate via the existing flow handlers (handleItemChange,
 * handleAddItemInCategory, handleRemoveItem, handleRenameCategory,
 * handleAddCategory). The single MenuUnsavedBar / handleSave path is
 * unchanged — nothing is written to the DB until the user clicks Save there.
 */
export function MenuReviewPanel({ flow }: MenuReviewPanelProps) {
  const t = useTranslations("dashboard.menu");
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);

  // Active category key — initialise to the first category at render time so the
  // detail pane is populated immediately (no empty flash before effects run).
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(
    () => flow.allCategories[0]?.key ?? null,
  );

  // Auto-select first category on mount or when categories change
  useEffect(() => {
    if (flow.allCategories.length === 0) {
      setActiveCategoryKey(null);
      return;
    }
    if (
      activeCategoryKey === null ||
      !flow.allCategories.some((c) => c.key === activeCategoryKey)
    ) {
      setActiveCategoryKey(flow.allCategories[0].key);
    }
  }, [activeCategoryKey, flow.allCategories]);

  // Clear focus hint on first render (same as before)
  useEffect(() => {
    if (flow.mode === "review" && flow.focusItemId !== null) {
      flow.clearFocusItemId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeGroup =
    activeCategoryKey === null
      ? null
      : (flow.allGroupedItems.find(
          (group) => group.key === activeCategoryKey,
        ) ?? null);

  function handleSaveRequest() {
    if (flow.saveValidationMessages.length > 0) {
      setValidationDialogOpen(true);
      return;
    }
    flow.handleSave();
  }

  function handleRenameCategory(oldName: string, newName: string) {
    flow.handleRenameCategory(oldName, newName);
    if (activeCategoryKey === categoryKey(oldName)) {
      setActiveCategoryKey(categoryKey(newName));
    }
  }

  // Category management is absorbed into the master-detail UI: add via the rail,
  // rename inline in the detail header, start-over via the detail overflow menu.
  // The old bulk "edit manual categories" picker and edit-mode toggle are not
  // surfaced in this layout.

  return (
    <div className="relative flex h-full w-full flex-col">
      <MenuSaveBanner show={flow.showSaveBanner} />

      {/* Error banner */}
      {flow.error ? (
        <div className="border-b border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-6 py-3 text-[14px] text-[var(--bad)]">
          {flow.error}
        </div>
      ) : null}

      {/* Two-pane layout — fills remaining height */}
      <div className="menu-master-detail flex flex-1 overflow-hidden md:flex-row max-md:flex-col">
        {/* Master: category rail */}
        <MenuCategoryRail
          categories={flow.allCategories}
          totalItems={flow.totalItems}
          activeCategoryKey={activeCategoryKey}
          onSelectCategory={setActiveCategoryKey}
          onAddCategory={flow.handleAddCategory}
        />

        {/* Detail: selected category */}
        {activeGroup !== null ? (
          <MenuCategoryDetail
            group={activeGroup}
            validation={flow.validation}
            categories={flow.allCategories.map((c) => c.displayName)}
            onItemChange={flow.handleItemChange}
            onRemoveItem={flow.handleRemoveItem}
            onAddItemInCategory={flow.handleAddItemInCategory}
            onAddCategory={flow.handleAddCategory}
            onRenameCategory={handleRenameCategory}
            onStartOverClick={() => flow.setConfirmStartOverOpen(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center p-12 text-[14px] text-[var(--ink-mute)]">
            {flow.allCategories.length === 0
              ? t("reviewEmptyDesc")
              : t("categoryBoard.emptyPreview")}
          </div>
        )}
      </div>

      {/* Batch save bar — unchanged, still the single commit path */}
      <MenuUnsavedBar
        hasUnsavedChanges={flow.hasUnsavedChanges}
        hasOnlyHiddenChanges={flow.hasOnlyHiddenChanges}
        validItemCount={flow.validation.validItems.length}
        hasValidationErrors={flow.validation.hasErrors}
        isSaving={flow.isSaving}
        isFocusedCategory={false}
        onUndo={flow.handleUndo}
        onSave={handleSaveRequest}
        onClearCategoryFilter={flow.clearCategoryFilter}
      />

      {/* Dialogs */}
      <MenuStartOverDialog
        open={flow.confirmStartOverOpen}
        onOpenChange={flow.setConfirmStartOverOpen}
        onConfirm={flow.handleStartOver}
      />

      <MenuValidationDialog
        open={validationDialogOpen}
        messages={flow.saveValidationMessages}
        onOpenChange={setValidationDialogOpen}
      />
    </div>
  );
}
