"use client";

import { useEffect } from "react";

import { MenuGroupedItems } from "@/components/dashboard/menu/MenuGroupedItems";
import { MenuReviewHeader } from "@/components/dashboard/menu/MenuReviewHeader";
import { MenuReviewToolbar } from "@/components/dashboard/menu/MenuReviewToolbar";
import { MenuSaveBanner } from "@/components/dashboard/menu/MenuSaveBanner";
import { MenuStartOverDialog } from "@/components/dashboard/menu/MenuStartOverDialog";
import { MenuUnsavedBar } from "@/components/dashboard/menu/MenuUnsavedBar";
import type { MenuManagerFlow } from "@/hooks/useMenuManagerFlow";

type MenuReviewPanelProps = {
  flow: MenuManagerFlow;
};

export function MenuReviewPanel({ flow }: MenuReviewPanelProps) {
  // After the first render of review mode, clear the focus hint so it
  // doesn't re-trigger on subsequent renders.
  useEffect(() => {
    if (flow.mode === "review" && flow.focusItemId !== null) {
      flow.clearFocusItemId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full pb-[120px]">
      <MenuSaveBanner show={flow.showSaveBanner} />

      <div className="w-full px-10 py-10 max-md:px-6 max-md:py-8">
        <MenuReviewHeader
          totalItems={flow.totalItems}
          categoryCount={flow.allCategories.length}
        />

        {flow.error ? (
          <div className="mt-5 rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)]">
            {flow.error}
          </div>
        ) : null}

        <MenuReviewToolbar
          searchQuery={flow.searchQuery}
          selectedCategoryKeys={flow.selectedCategoryKeys}
          allCategories={flow.allCategories}
          totalItems={flow.totalItems}
          isSaving={flow.isSaving}
          editMode={flow.editMode}
          onSearchQueryChange={flow.setSearchQuery}
          onCategoryKeysChange={flow.setSelectedCategoryKeys}
          onAddCategory={flow.handleAddCategory}
          onStartOverClick={() => flow.setConfirmStartOverOpen(true)}
          onToggleEditMode={() => flow.setEditMode(!flow.editMode)}
        />

        <MenuGroupedItems
          groupedItems={flow.groupedItems}
          isFiltering={flow.isFiltering}
          validation={flow.validation}
          categories={flow.allCategories.map((c) => c.displayName)}
          focusItemId={flow.focusItemId ?? undefined}
          readOnly={!flow.editMode}
          expandedCategories={flow.expandedCategories}
          onToggleCategory={flow.toggleCategory}
          onAddItemInCategory={flow.handleAddItemInCategory}
          onAddCategory={flow.handleAddCategory}
          onItemChange={flow.handleItemChange}
          onRemoveItem={flow.handleRemoveItem}
          onRenameCategory={flow.handleRenameCategory}
        />
      </div>

      <MenuUnsavedBar
        hasUnsavedChanges={flow.hasUnsavedChanges}
        hasOnlyHiddenChanges={flow.hasOnlyHiddenChanges}
        validItemCount={flow.validation.validItems.length}
        hasValidationErrors={flow.validation.hasErrors}
        isSaving={flow.isSaving}
        canSave={flow.canSave}
        onUndo={flow.handleUndo}
        onSave={flow.handleSave}
        onClearCategoryFilter={flow.clearCategoryFilter}
      />

      <MenuStartOverDialog
        open={flow.confirmStartOverOpen}
        onOpenChange={flow.setConfirmStartOverOpen}
        onConfirm={flow.handleStartOver}
      />
    </div>
  );
}
