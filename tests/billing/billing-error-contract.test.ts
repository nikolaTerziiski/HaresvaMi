import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const startTrialRouteSource = source("app/api/billing/start-trial/route.ts");
const checkoutRouteSource = source(
  "app/api/billing/create-checkout-session/route.ts",
);
const billingActionsSource = source(
  "components/dashboard/billing/BillingActions.tsx",
);
const settingsPageSource = source(
  "app/(dashboard)/dashboard/(shell)/settings/page.tsx",
);
const insightsAiSummarySource = source(
  "components/dashboard/insights/InsightsAiSummary.tsx",
);
const menuTierLockedSource = source(
  "components/dashboard/menu/import/MenuTierLockedCard.tsx",
);

test("billing settings buttons call the billing APIs and surface API messages", () => {
  assert.match(settingsPageSource, /<BillingActions/);
  assert.match(billingActionsSource, /fetch\("\/api\/billing\/start-trial"/);
  assert.match(
    billingActionsSource,
    /fetch\("\/api\/billing\/create-checkout-session"/,
  );
  assert.match(billingActionsSource, /role="alert"/);
  assert.match(billingActionsSource, /payload\.message/);
});

test("start trial route returns owner-friendly Bulgarian errors", () => {
  assert.match(startTrialRouteSource, /messageForStartTrialError/);
  assert.match(startTrialRouteSource, /Добави поне 5 активни продукта/);
  assert.match(startTrialRouteSource, /Пробният период вече е използван/);
  assert.doesNotMatch(startTrialRouteSource, /message:\s*error\.message/);
});

test("checkout route does not expose raw provider or environment errors", () => {
  assert.match(checkoutRouteSource, /CHECKOUT_FAILED_MESSAGE/);
  assert.match(checkoutRouteSource, /checkout_failed/);
  assert.doesNotMatch(
    checkoutRouteSource,
    /error instanceof Error \? error\.message/,
  );
  assert.doesNotMatch(checkoutRouteSource, /Unable to create checkout/);
});

test("upgrade links target the existing settings page", () => {
  assert.match(insightsAiSummarySource, /href="\/dashboard\/settings"/);
  assert.match(menuTierLockedSource, /href="\/dashboard\/settings"/);
  assert.doesNotMatch(insightsAiSummarySource, /\/dashboard\/billing/);
  assert.doesNotMatch(menuTierLockedSource, /\/dashboard\/billing/);
});
