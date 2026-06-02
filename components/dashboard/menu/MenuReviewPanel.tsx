"use client";

import { useEffect, useState } from "react";

import { MenuCategoryBoard } from "@/components/dashboard/menu/MenuCategoryBoard";
import { MenuCategoryFocusedEditor } from "@/components/dashboard/menu/MenuCategoryFocusedEditor";
import { MenuReviewHeader } from "@/components/dashboard/menu/MenuReviewHeader";
import { MenuReviewToolbar } from "@/components/dashboard/menu/MenuReviewToolbar";
import { MenuSaveBanner } from "@/components/dashboard/menu/MenuSaveBanner";
import { MenuStartOverDialog } from "@/components/dashboard/menu/MenuStartOverDialog";
import { MenuUnsavedBar } from "@/components/dashboard/menu/MenuUnsavedBar";
import { MenuValidationDialog } from "@/components/dashboard/menu/MenuValidationDialog";
import type { MenuManagerFlow } from "@/hooks/useMenuManagerFlow";
import { categoryKey } from "@/lib/menu/format";

type MenuReviewPanelProps = {
  flow: MenuManagerFlow;
};

export function MenuReviewPanel({ flow }: MenuReviewPanelProps) {
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(
    null,
  );
  const activeGroup =
    activeCategoryKey === null
      ? null
      : (flow.allGroupedItems.find(
          (group) => group.key === activeCategoryKey,
        ) ?? null);

  // After the first render of review mode, clear the focus hint so it
  // doesn't re-trigger on subsequent renders.
  useEffect(() => {
    if (flow.mode === "review" && flow.focusItemId !== null) {
      flow.clearFocusItemId();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      activeCategoryKey !== null &&
      !flow.allGroupedItems.some((group) => group.key === activeCategoryKey)
    ) {
      setActiveCategoryKey(null);
    }
  }, [activeCategoryKey, flow.allGroupedItems]);

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

  return (
    <div className="relative w-full pb-[120px]">
      <MenuSaveBanner show={flow.showSaveBanner} />

      <div className="mx-auto w-full max-w-6xl px-10 py-10 max-md:px-6 max-md:py-8">
        <MenuReviewHeader
          totalItems={flow.totalItems}
          categoryCount={flow.allCategories.length}
          canEditCategories={flow.canEditManualCategories}
          onEditCategories={flow.handleEditManualCategories}
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

        {activeGroup ? (
          <MenuCategoryFocusedEditor
            group={activeGroup}
            validation={flow.validation}
            categories={flow.allCategories.map((c) => c.displayName)}
            focusItemId={flow.focusItemId ?? undefined}
            readOnly={!flow.editMode}
            onBack={() => setActiveCategoryKey(null)}
            onAddItemInCategory={flow.handleAddItemInCategory}
            onAddCategory={flow.handleAddCategory}
            onItemChange={flow.handleItemChange}
            onRemoveItem={flow.handleRemoveItem}
            onRenameCategory={handleRenameCategory}
          />
        ) : (
          <MenuCategoryBoard
            groupedItems={flow.groupedItems}
            isFiltering={flow.isFiltering}
            validation={flow.validation}
            readOnly={!flow.editMode}
            onOpenCategory={setActiveCategoryKey}
            onAddItem={() => flow.handleAddItemInCategory("")}
          />
        )}
      </div>

      <MenuUnsavedBar
        hasUnsavedChanges={flow.hasUnsavedChanges}
        hasOnlyHiddenChanges={flow.hasOnlyHiddenChanges}
        validItemCount={flow.validation.validItems.length}
        hasValidationErrors={flow.validation.hasErrors}
        isSaving={flow.isSaving}
        onUndo={flow.handleUndo}
        onSave={handleSaveRequest}
        onClearCategoryFilter={flow.clearCategoryFilter}
      />

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
