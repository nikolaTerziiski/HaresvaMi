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
const menuManualStarterSource = source(
  "components/dashboard/menu/MenuManualStarter.tsx",
);
const menuReviewPanelSource = source(
  "components/dashboard/menu/MenuReviewPanel.tsx",
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
  assert.match(menuManagerSource, /onContinue=\{flow\.handleManualStart\}/);
  assert.match(menuManagerSource, /onBack=\{flow\.handleManualBack\}/);
});

test("MenuManualStarter renders chip cloud, custom input, and continue/back controls", () => {
  assert.match(menuManualStarterSource, /SUGGESTED_MANUAL_CATEGORIES/);
  assert.match(menuManualStarterSource, /onContinue/);
  assert.match(menuManualStarterSource, /onBack/);
  assert.match(menuManualStarterSource, /customInput/);
  assert.match(menuManualStarterSource, /t\("manualStarter\.continue"\)|t\("continue"\)/);
});

test("MenuReviewToolbar renders the edit toggle button with Pencil/Check icon import", () => {
  assert.match(menuToolbarSource, /editMode/);
  assert.match(menuToolbarSource, /onToggleEditMode/);
  assert.match(menuToolbarSource, /Pencil/);
  assert.match(menuToolbarSource, /Check/);
  assert.match(menuToolbarSource, /t\("editToggle\.edit"\)|t\("editToggle\.done"\)/);
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
