"use client";

import { MenuGroupedItems } from "@/components/dashboard/menu/MenuGroupedItems";
import { MenuReviewHeader } from "@/components/dashboard/menu/MenuReviewHeader";
import { MenuReviewToolbar } from "@/components/dashboard/menu/MenuReviewToolbar";
import { MenuStartOverDialog } from "@/components/dashboard/menu/MenuStartOverDialog";
import { MenuUnsavedBar } from "@/components/dashboard/menu/MenuUnsavedBar";
import type { MenuManagerFlow } from "@/hooks/useMenuManagerFlow";

type MenuReviewPanelProps = {
  flow: MenuManagerFlow;
};

export function MenuReviewPanel({ flow }: MenuReviewPanelProps) {
  return (
    <div className="w-full pb-[120px]">
      <MenuReviewHeader
        totalItems={flow.totalItems}
        categoryCount={flow.allCategories.length}
      />

      {flow.error ? (
        <div className="mx-9 mt-5 rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)] max-md:mx-5">
          {flow.error}
        </div>
      ) : null}

      <MenuReviewToolbar
        searchQuery={flow.searchQuery}
        selectedCategoryKey={flow.selectedCategoryKey}
        allCategories={flow.allCategories}
        totalItems={flow.totalItems}
        isSaving={flow.isSaving}
        onSearchQueryChange={flow.setSearchQuery}
        onCategoryChange={flow.setSelectedCategoryKey}
        onStartOverClick={() => flow.setConfirmStartOverOpen(true)}
      />

      <MenuGroupedItems
        groupedItems={flow.groupedItems}
        isFiltering={flow.isFiltering}
        validation={flow.validation}
        onAddItemInCategory={flow.handleAddItemInCategory}
        onItemChange={flow.handleItemChange}
        onRemoveItem={flow.handleRemoveItem}
      />

      <MenuUnsavedBar
        hasUnsavedChanges={flow.hasUnsavedChanges}
        validItemCount={flow.validation.validItems.length}
        hasValidationErrors={flow.validation.hasErrors}
        isSaving={flow.isSaving}
        canSave={flow.canSave}
        onUndo={flow.handleUndo}
        onSave={flow.handleSave}
      />

      <MenuStartOverDialog
        open={flow.confirmStartOverOpen}
        onOpenChange={flow.setConfirmStartOverOpen}
        onConfirm={flow.handleStartOver}
      />
    </div>
  );
}
