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
