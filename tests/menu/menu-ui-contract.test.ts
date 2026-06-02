import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const menuEmptyPanelSource = source(
  "components/dashboard/menu/MenuEmptyPanel.tsx",
);
const menuEmptyStateSource = source(
  "components/dashboard/menu/MenuEmptyState.tsx",
);
const menuManagerSource = source("components/dashboard/menu/MenuManager.tsx");
const menuPageSource = source(
  "app/(dashboard)/dashboard/(shell)/menu/page.tsx",
);
const menuManualStarterSource = source(
  "components/dashboard/menu/MenuManualStarter.tsx",
);
const menuReviewPanelSource = source(
  "components/dashboard/menu/MenuReviewPanel.tsx",
);
const menuCategoryBoardSource = source(
  "components/dashboard/menu/MenuCategoryBoard.tsx",
);
const menuCategoryFocusedEditorSource = source(
  "components/dashboard/menu/MenuCategoryFocusedEditor.tsx",
);
const menuUnsavedBarSource = source(
  "components/dashboard/menu/MenuUnsavedBar.tsx",
);
const menuValidationDialogSource = source(
  "components/dashboard/menu/MenuValidationDialog.tsx",
);
const menuStartOverDialogSource = source(
  "components/dashboard/menu/MenuStartOverDialog.tsx",
);
const menuReviewHeaderSource = source(
  "components/dashboard/menu/MenuReviewHeader.tsx",
);
const menuToolbarSource = source(
  "components/dashboard/menu/MenuReviewToolbar.tsx",
);
const menuGroupCardSource = source(
  "components/dashboard/menu/MenuGroupCard.tsx",
);
const menuItemRowSource = source(
  "components/dashboard/menu/MenuItemEditorRow.tsx",
);
const restaurantSetupSource = source(
  "components/dashboard/RestaurantSetupForm.tsx",
);
const productDocsSource = source("docs/00-product.md");
const localTestingSource = source("docs/LOCAL-TESTING.md");

test("restaurant setup redirects owners to menu activation", () => {
  assert.match(restaurantSetupSource, /router\.replace\("\/dashboard\/menu"\)/);
});

test("first-time menu state offers AI upload, manual entry, and skip affordance", () => {
  assert.match(menuEmptyStateSource, /t\.rich\("firstTimeTitle"/);
  assert.match(menuEmptyStateSource, /t\("firstTimeSubtitle"\)/);
  assert.match(menuEmptyStateSource, /\/dashboard\/menu\/import-ai/);
  assert.match(menuEmptyStateSource, /onManualEntry/);
  assert.match(menuEmptyPanelSource, /href="\/dashboard"/);
  assert.match(menuEmptyPanelSource, /t\("skipForNow"\)/);
});

test("first-time menu AI path is entitlement-aware and links Pro lock to settings", () => {
  assert.match(menuPageSource, /canExtractMenu\(restaurant\.id\)/);
  assert.match(
    menuPageSource,
    /menuImportEntitlement=\{menuImportEntitlement\}/,
  );
  assert.match(menuManagerSource, /menuImportEntitlement: EntitlementResult/);
  assert.match(menuEmptyStateSource, /menuImportEntitlement\.allowed/);
  assert.match(menuEmptyStateSource, /aiLocked/);
  assert.match(menuEmptyStateSource, /blur-\[2px\]/);
  assert.match(menuEmptyStateSource, /<Lock /);
  assert.match(menuEmptyStateSource, /href="\/dashboard\/settings"/);
  assert.match(menuEmptyStateSource, /t\("aiLockedCta"\)/);
});

test("menu review surface has category tools and save feedback states", () => {
  assert.match(
    menuReviewPanelSource,
    /<MenuSaveBanner show=\{flow\.showSaveBanner\}/,
  );
  assert.match(menuReviewPanelSource, /<MenuUnsavedBar/);
  assert.match(menuToolbarSource, /onAddCategory/);
  assert.match(menuToolbarSource, /selectedCategoryKeys/);
  assert.match(menuToolbarSource, /t\("searchPlaceholder"\)/);
});

test("menu review uses a two-column category board and focused category editor", () => {
  assert.match(menuReviewPanelSource, /MenuCategoryBoard/);
  assert.match(menuReviewPanelSource, /MenuCategoryFocusedEditor/);
  assert.match(menuReviewPanelSource, /activeCategoryKey/);
  assert.match(menuReviewPanelSource, /allGroupedItems/);
  assert.match(menuReviewPanelSource, /max-w-6xl/);
  assert.match(menuCategoryBoardSource, /lg:grid-cols-2/);
  assert.match(menuCategoryBoardSource, /grid-cols-1/);
  assert.match(menuCategoryBoardSource, /categoryBoard\.open/);
  assert.match(menuCategoryBoardSource, /categoryBoard\.problems/);
  assert.match(menuCategoryFocusedEditorSource, /categoryBoard\.back/);
  assert.match(menuCategoryFocusedEditorSource, /showCollapseToggle=\{false\}/);
});

test("menu review save remains clickable and opens a validation dialog", () => {
  assert.match(menuReviewPanelSource, /MenuValidationDialog/);
  assert.match(menuReviewPanelSource, /saveValidationMessages/);
  assert.match(menuReviewPanelSource, /handleSaveRequest/);
  assert.match(menuReviewPanelSource, /setValidationDialogOpen\(true\)/);
  assert.match(menuUnsavedBarSource, /disabled=\{isSaving\}/);
  assert.match(menuUnsavedBarSource, /max-w-6xl/);
  assert.doesNotMatch(menuUnsavedBarSource, /disabled=\{!canSave\}/);
  assert.doesNotMatch(menuUnsavedBarSource, /canSave/);
  assert.match(menuValidationDialogSource, /validationDialog/);
  assert.match(menuValidationDialogSource, /messages\.map/);
  assert.match(menuValidationDialogSource, /t\("close"\)/);
});

test("menu review toolbar uses neutral new category and destructive start-over styling", () => {
  assert.match(menuToolbarSource, /FolderPlus/);
  assert.match(menuToolbarSource, /border-\[var\(--rule\)\]/);
  assert.match(menuToolbarSource, /bg-\[var\(--paper\)\]/);
  assert.match(menuToolbarSource, /RotateCcw/);
  assert.match(menuToolbarSource, /text-\[var\(--bad\)\]/);
  assert.match(menuStartOverDialogSource, /bg-\[var\(--bad\)\]/);
});

test("item rows expose accessible move controls and derived EUR pricing", () => {
  assert.match(menuItemRowSource, /import \{ bgnToEur, formatEur \}/);
  assert.match(menuItemRowSource, /parsePrice\(item\.price\)/);
  assert.match(menuItemRowSource, /aria-label=\{t\("moveItemAria"\)\}/);
  assert.match(menuItemRowSource, /aria-label=\{t\("table\.remove"\)\}/);
  assert.match(menuItemRowSource, /flash-error/);
});

test("MenuManager renders manual_starter branch wired to handleManualStart and handleManualBack", () => {
  assert.match(menuManagerSource, /mode === "manual_starter"/);
  assert.match(menuManagerSource, /<MenuManualStarter/);
  assert.match(
    menuManagerSource,
    /initialCategories=\{flow\.manualStarterCategories\}/,
  );
  assert.match(
    menuManagerSource,
    /protectedCategories=\{flow\.protectedManualStarterCategories\}/,
  );
  assert.match(menuManagerSource, /onContinue=\{flow\.handleManualStart\}/);
  assert.match(menuManagerSource, /onBack=\{flow\.handleManualBack\}/);
});

test("MenuManualStarter renders category card grid, custom add card, and continue/back controls", () => {
  assert.match(menuManualStarterSource, /SUGGESTED_MANUAL_CATEGORIES/);
  assert.match(menuManualStarterSource, /grid-cols-2/);
  assert.match(menuManualStarterSource, /md:grid-cols-3/);
  assert.match(menuManualStarterSource, /min-h-\[180px\]/);
  assert.match(menuManualStarterSource, /bg-\[var\(--good\)\]/);
  assert.match(menuManualStarterSource, /aria-pressed=\{isSelected\}/);
  assert.match(menuManualStarterSource, /aria-disabled=\{isProtected\}/);
  assert.match(menuManualStarterSource, /categoryColorFor/);
  assert.match(menuManualStarterSource, /<Check /);
  assert.match(menuManualStarterSource, /<Plus /);
  assert.match(menuManualStarterSource, /onContinue/);
  assert.match(menuManualStarterSource, /onBack/);
  assert.match(menuManualStarterSource, /customCategories/);
  assert.match(
    menuManualStarterSource,
    /t\("manualStarter\.continue"\)|t\("continue"\)/,
  );
});

test("menu review exposes safe category revisit for manual-start drafts", () => {
  assert.match(menuReviewPanelSource, /flow\.canEditManualCategories/);
  assert.match(menuReviewPanelSource, /flow\.handleEditManualCategories/);
  assert.match(menuReviewHeaderSource, /canEditCategories/);
  assert.match(menuReviewHeaderSource, /onEditCategories/);
  assert.match(menuReviewHeaderSource, /t\("editCategories"\)/);
});

test("MenuReviewToolbar renders the edit toggle button with Pencil/Check icon import", () => {
  assert.match(menuToolbarSource, /editMode/);
  assert.match(menuToolbarSource, /onToggleEditMode/);
  assert.match(menuToolbarSource, /Pencil/);
  assert.match(menuToolbarSource, /Check/);
  assert.match(
    menuToolbarSource,
    /t\("editToggle\.edit"\)|t\("editToggle\.done"\)/,
  );
});

test("MenuGroupCard renders a collapsible chevron and accepts readOnly + expanded props", () => {
  assert.match(menuGroupCardSource, /ChevronDown/);
  assert.match(menuGroupCardSource, /readOnly/);
  assert.match(menuGroupCardSource, /expanded/);
  assert.match(menuGroupCardSource, /onToggleExpand/);
  assert.match(menuGroupCardSource, /transition-transform/);
});

test("docs describe the implemented menu activation and manual QA path", () => {
  assert.match(productDocsSource, /\/dashboard\/menu/);
  assert.match(productDocsSource, /AI upload/);
  assert.match(productDocsSource, /Manual entry/);
  assert.match(localTestingSource, /new category creation/i);
  assert.match(localTestingSource, /category rename/i);
  assert.match(localTestingSource, /move-to-category/i);
  assert.match(localTestingSource, /top success banner/i);
});
