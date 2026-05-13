import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const customerPanelSource = source("components/kiosk/scan/CustomerPanel.tsx");
const dishRatingRowSource = source("components/kiosk/scan/DishRatingRow.tsx");
const dishMarkSource = source("components/kiosk/scan/DishMark.tsx");
const reviewPanelSource = source("components/kiosk/scan/ReviewPanel.tsx");
const scanHeaderSource = source("components/kiosk/scan/ScanHeader.tsx");
const starRatingSource = source("components/kiosk/scan/StarRating.tsx");
const kioskScanScreenSource = source("components/kiosk/KioskScanScreen.tsx");

test("CustomerPanel uses 5-star behavior, not numeric rating buttons", () => {
  assert.match(customerPanelSource, /<DishRatingRow/);
  assert.match(dishRatingRowSource, /<StarRating/);
  assert.match(starRatingSource, /import \{ Star \} from "lucide-react"/);
  assert.match(starRatingSource, /length:\s*5/);
  assert.doesNotMatch(starRatingSource, /length:\s*10/);
  assert.doesNotMatch(starRatingSource, />\s*\{score\}\s*<\/button>/);
});

test("CustomerPanel rating rows use imageUrl or a warm image fallback", () => {
  assert.match(dishRatingRowSource, /imageUrl=\{item\.imageUrl\}/);
  assert.match(dishMarkSource, /if \(imageUrl\)/);
  assert.match(dishMarkSource, /<img src=\{imageUrl\}/);
  assert.match(dishMarkSource, /getInitial\(name\)/);
});

test("CustomerPanel rating rows use dish descriptions", () => {
  assert.match(dishRatingRowSource, /item\.description/);
});

test("CustomerPanel keeps customer rating footer visible while dish list scrolls", () => {
  assert.match(customerPanelSource, /h-full min-h-0 flex-col overflow-hidden/);
  assert.match(customerPanelSource, /min-h-0 flex-1 overflow-auto/);
  assert.match(customerPanelSource, /<footer/);
  assert.match(
    kioskScanScreenSource,
    /<main className="min-h-0 flex-1 bg-\[var\(--paper\)\]">/,
  );
});

test("CustomerPanel keeps overall rating secondary in the footer", () => {
  assert.match(customerPanelSource, /<footer[\s\S]*copy\.overallTitle/);

  const scrollListSource =
    customerPanelSource
      .split('<div className="min-h-0 flex-1 overflow-auto')[1]
      ?.split("<footer")[0] ?? "";

  assert.doesNotMatch(scrollListSource, /copy\.overallTitle/);
});

test("CustomerPanel rows stay compact but touch-friendly for landscape tablets", () => {
  assert.match(dishRatingRowSource, /min-h-16/);
  assert.match(dishRatingRowSource, /text-\[17px\]/);
  assert.match(starRatingSource, /size-11/);
});

test("ReviewPanel uses Bulgarian staff-facing match labels", () => {
  assert.match(reviewPanelSource, /alias:\s*"съкращение"/);
  assert.match(reviewPanelSource, /fuzzy_match:\s*"вероятно съвпадение"/);
  assert.match(reviewPanelSource, /unknown:\s*"неразпознато"/);
});

test("ReviewPanel exposes ignore action for every receipt row", () => {
  const beforeIgnoreButton = reviewPanelSource.split("Игнорирай реда")[0] ?? "";
  const ignoreConditionSource = beforeIgnoreButton.slice(-400);

  assert.match(reviewPanelSource, /onClick=\{\(\) => onIgnoreRow\(index\)\}/);
  assert.doesNotMatch(ignoreConditionSource, /matchedVia === "unknown"/);
});

test("KioskScanScreen separates staff and customer visual states", () => {
  assert.match(kioskScanScreenSource, /audience=\{audience\}/);
  assert.match(scanHeaderSource, /const isStaff = audience === "staff"/);
  assert.match(scanHeaderSource, /\{isStaff \? \(/);
  assert.match(
    kioskScanScreenSource,
    /isCustomerFacing \? "bg-\[var\(--paper\)\]"/,
  );
});

test("KioskScanScreen does not render ReceiptPreview during customer or thanks modes", () => {
  assert.match(
    kioskScanScreenSource,
    /const isCustomerFacing\s*=\s*flow\.mode === "customer"\s*\|\|\s*flow\.mode === "thanks"/,
  );
  assert.match(
    kioskScanScreenSource,
    /\{isCustomerFacing \? \([\s\S]*<CustomerPanel[\s\S]*<ThanksPanel[\s\S]*\) : \([\s\S]*<ReceiptPreview/,
  );
});
