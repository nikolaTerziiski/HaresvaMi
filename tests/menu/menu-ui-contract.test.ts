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
// New master-detail sub-components
const menuCategoryRailSource = source(
  "components/dashboard/menu/MenuCategoryRail.tsx",
);
const menuCategoryDetailSource = source(
  "components/dashboard/menu/MenuCategoryDetail.tsx",
);
const menuDishEditorSource = source(
  "components/dashboard/menu/MenuDishEditor.tsx",
);
const menuDishRowSource = source("components/dashboard/menu/MenuDishRow.tsx");
// Still-referenced existing components
const menuUnsavedBarSource = source(
  "components/dashboard/menu/MenuUnsavedBar.tsx",
);
const menuValidationDialogSource = source(
  "components/dashboard/menu/MenuValidationDialog.tsx",
);
const menuStartOverDialogSource = source(
  "components/dashboard/menu/MenuStartOverDialog.tsx",
);
const menuItemRowSource = source(
  "components/dashboard/menu/MenuItemEditorRow.tsx",
);
const menuImportFlowSource = source(
  "components/dashboard/menu/import/MenuImportFlow.tsx",
);
const uiMenuSource = source("components/ui/menu.tsx");
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

// ── Master-detail review layout ──────────────────────────────────────────────

test("menu review renders master-detail layout with rail, detail, and dish editor", () => {
  // Panel renders the save banner and the batch save bar unchanged
  assert.match(
    menuReviewPanelSource,
    /<MenuSaveBanner show=\{flow\.showSaveBanner\}/,
  );
  assert.match(menuReviewPanelSource, /<MenuUnsavedBar/);

  // Panel renders the new master-detail sub-components
  assert.match(menuReviewPanelSource, /MenuCategoryRail/);
  assert.match(menuReviewPanelSource, /MenuCategoryDetail/);

  // Category rail exists as a standalone component
  assert.match(menuCategoryRailSource, /onAddCategory/);
  assert.match(menuCategoryRailSource, /activeCategoryKey/);
  assert.match(menuCategoryRailSource, /rail\.title/);
  assert.match(menuCategoryRailSource, /rail\.addCategory/);

  // Detail exists and uses dish row + editor
  assert.match(menuCategoryDetailSource, /MenuDishRow/);
  assert.match(menuCategoryDetailSource, /MenuDishEditor/);
  assert.match(menuCategoryDetailSource, /onAddItemInCategory/);
  assert.match(menuCategoryDetailSource, /onRenameCategory/);
});

test("dish row shows name, description, BGN price, and EUR equivalent", () => {
  assert.match(menuDishRowSource, /import \{ bgnToEur, formatEur \}/);
  assert.match(menuDishRowSource, /parsePrice\(item\.price\)/);
  assert.match(menuDishRowSource, /dishRow\.noDescription/);
  // Edit and delete hover icons
  assert.match(menuDishRowSource, /dishRow\.editAria/);
  assert.match(menuDishRowSource, /table\.remove/);
});

test("dish editor holds a local draft and applies changes via handleItemChange on save", () => {
  // Editor is a separate component — local draft pattern
  assert.match(menuDishEditorSource, /draftName/);
  assert.match(menuDishEditorSource, /draftPrice/);
  assert.match(menuDishEditorSource, /draftDesc/);
  assert.match(menuDishEditorSource, /onSave/);
  assert.match(menuDishEditorSource, /onDiscard/);
  // Photo slot must be disabled/placeholder — no upload
  assert.match(menuDishEditorSource, /editor\.photoPlaceholder/);
  // Live EUR conversion
  assert.match(menuDishEditorSource, /bgnToEur/);
  assert.match(menuDishEditorSource, /formatEur/);
  // Category move selector is inside the editor
  assert.match(menuDishEditorSource, /setDraftCategory/);
});

test("dish editor keeps aliases accessible via AliasManagerPopover", () => {
  assert.match(menuDishEditorSource, /AliasManagerPopover/);
  // Popover still gated on hasPersisted && aliasOpen — no eager fetch
  assert.match(menuDishEditorSource, /hasPersisted && aliasOpen/);
  assert.match(menuDishEditorSource, /editor\.aliasesSection/);
});

test("dish editor does not save to DB — onSave only calls handleItemChange fields", () => {
  // Editor receives onSave callback (not a direct DB call) — the caller wires
  // it to flow.handleItemChange per field. The global MenuUnsavedBar remains
  // the single DB commit path.
  assert.match(menuCategoryDetailSource, /flow\.handleItemChange|onItemChange/);
  assert.match(menuCategoryDetailSource, /handleEditorSave/);
  // The panel itself still wires handleSave → flow.handleSave
  assert.match(menuReviewPanelSource, /flow\.handleSave/);
});

test("category rename is inline click-to-edit in the detail pane", () => {
  assert.match(menuCategoryDetailSource, /onRenameCategory/);
  assert.match(menuCategoryDetailSource, /editingName/);
  assert.match(menuCategoryDetailSource, /commitRename/);
  assert.match(menuCategoryDetailSource, /draftName/);
});

test("start-over is accessible from the detail overflow menu and wired destructively", () => {
  // Detail pane exposes start-over via an overflow menu
  assert.match(menuCategoryDetailSource, /onStartOverClick/);
  assert.match(menuCategoryDetailSource, /RotateCcw/);
  // Panel passes it to MenuStartOverDialog
  assert.match(menuReviewPanelSource, /MenuStartOverDialog/);
  assert.match(menuReviewPanelSource, /flow\.setConfirmStartOverOpen/);
  assert.match(menuReviewPanelSource, /flow\.handleStartOver/);
  // Dialog still has destructive styling
  assert.match(menuStartOverDialogSource, /bg-\[var\(--bad\)\]/);
});

test("review panel drops the old board/toolbar chrome for the master-detail layout", () => {
  // The redesign replaces the board + focused editor + toolbar with the rail +
  // detail + slide-over editor. Category management is absorbed into those.
  assert.doesNotMatch(menuReviewPanelSource, /MenuCategoryBoard/);
  assert.doesNotMatch(menuReviewPanelSource, /MenuReviewToolbar/);
  assert.doesNotMatch(menuReviewPanelSource, /MenuCategoryFocusedEditor/);
});

test("menu review save remains clickable and opens a validation dialog", () => {
  assert.match(menuReviewPanelSource, /MenuValidationDialog/);
  assert.match(menuReviewPanelSource, /saveValidationMessages/);
  assert.match(menuReviewPanelSource, /handleSaveRequest/);
  assert.match(menuReviewPanelSource, /setValidationDialogOpen\(true\)/);
  assert.match(menuUnsavedBarSource, /disabled=\{isSaving\}/);
  assert.match(menuUnsavedBarSource, /max-w-6xl/);
  assert.match(menuUnsavedBarSource, /isFocusedCategory/);
  assert.match(menuUnsavedBarSource, /saveChanges/);
  assert.match(menuUnsavedBarSource, /saveMenu/);
  assert.doesNotMatch(menuUnsavedBarSource, /disabled=\{!canSave\}/);
  assert.doesNotMatch(menuUnsavedBarSource, /canSave/);
  assert.match(menuValidationDialogSource, /validationDialog/);
  assert.match(menuValidationDialogSource, /messages\.map/);
  assert.match(menuValidationDialogSource, /t\("close"\)/);
});

test("menu page is full-bleed and the two-pane layout fills available height", () => {
  assert.match(menuPageSource, /DASHBOARD_PAGE_FULL_CLASS/);
  // Panel fills the container without a constrained max-w column
  assert.match(menuReviewPanelSource, /h-full w-full|flex.*h-full/);
  // Rail has a fixed width column on desktop
  assert.match(menuCategoryRailSource, /md:w-\[264px\]/);
});

// ── Existing stable assertions (unaffected by layout change) ─────────────────

test("item rows expose accessible move controls and derived EUR pricing", () => {
  assert.match(menuItemRowSource, /import \{ bgnToEur, formatEur \}/);
  assert.match(menuItemRowSource, /parsePrice\(item\.price\)/);
  assert.match(menuItemRowSource, /aria-label=\{t\("moveItemAria"\)\}/);
  assert.match(menuItemRowSource, /aria-label=\{t\("table\.remove"\)\}/);
  assert.match(menuItemRowSource, /flash-error/);
});

test("AI import page uses the shared centered dashboard frame", () => {
  assert.match(menuImportFlowSource, /DASHBOARD_PAGE_FRAME_CLASS/);
  assert.doesNotMatch(menuImportFlowSource, /className="w-full px-10/);
});

test("MenuGroupLabel is a plain element so it works without a Menu.Group ancestor", () => {
  // Base UI's Menu.GroupLabel throws "MenuGroupRootContext is missing" unless it
  // is wrapped in Menu.Group. Our labels render bare inside MenuContent (the
  // move-to-category menu), so MenuGroupLabel must NOT use the context-bound
  // primitive, or opening that menu crashes at runtime.
  assert.doesNotMatch(uiMenuSource, /MenuPrimitive\.GroupLabel/);
});

test("alias popover only mounts when open so it does not fetch eagerly per row", () => {
  // Regression guard: AliasManagerPopover fetches /api/receipt-aliases in a mount
  // effect. It must be gated behind a controlled open state, otherwise it mounts
  // for every persisted row on menu load and fires one API call per row.
  assert.match(menuItemRowSource, /<Popover open=\{aliasOpen\}/);
  assert.match(
    menuItemRowSource,
    /hasPersisted && aliasOpen \?[\s\S]{0,80}<AliasManagerPopover/,
  );
  assert.doesNotMatch(
    menuItemRowSource,
    /\{hasPersisted \?\s*\(?\s*<AliasManagerPopover/,
  );
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

test("docs describe the implemented menu activation and manual QA path", () => {
  assert.match(productDocsSource, /\/dashboard\/menu/);
  assert.match(productDocsSource, /AI upload/);
  assert.match(productDocsSource, /Manual entry/);
  assert.match(localTestingSource, /new category creation/i);
  assert.match(localTestingSource, /category rename/i);
  assert.match(localTestingSource, /move-to-category/i);
  assert.match(localTestingSource, /top success banner/i);
});
