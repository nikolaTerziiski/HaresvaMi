import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routeSource = readFileSync(
  join(process.cwd(), "app/api/receipt-aliases/learn/route.ts"),
  "utf8",
);
const learnSource = readFileSync(
  join(process.cwd(), "lib/receipt-aliases/learn.ts"),
  "utf8",
);

function assertSourceOrder(fileSource: string, snippets: string[]) {
  let previousIndex = -1;

  for (const snippet of snippets) {
    const nextIndex = fileSource.indexOf(snippet, previousIndex + 1);

    assert.notEqual(nextIndex, -1, `Missing source snippet: ${snippet}`);
    assert.ok(
      nextIndex > previousIndex,
      `Expected snippet to appear later: ${snippet}`,
    );

    previousIndex = nextIndex;
  }
}

test("/api/receipt-aliases/learn exports POST only", () => {
  assert.match(routeSource, /export async function POST/);
  assert.doesNotMatch(
    routeSource,
    /export async function (GET|PUT|PATCH|DELETE)/,
  );
});

test("/api/receipt-aliases/learn authorizes before writing", () => {
  assertSourceOrder(routeSource, [
    "const authorization = await authorizeKioskOrOwnerRestaurant",
    "if (!authorization.ok)",
    "return NextResponse.json(authorization.body",
    "const result = await learnReceiptAliases",
  ]);
});

test("/api/receipt-aliases/learn uses authorized restaurant id", () => {
  assert.match(
    routeSource,
    /learnReceiptAliases\(\s*\{[\s\S]*restaurantId:\s*authorization\.restaurantId,[\s\S]*aliases:\s*payload\.aliases,/,
  );
});

test("receipt alias learning verifies active restaurant menu items before alias writes", () => {
  assertSourceOrder(learnSource, [
    '.from("menu_items")',
    '.eq("restaurant_id", restaurantId)',
    '.eq("is_active", true)',
    '.is("deleted_at", null)',
    '.from("receipt_aliases")',
  ]);
});

test("receipt alias learning does not store receipt payloads or customer content", () => {
  assert.doesNotMatch(
    learnSource,
    /receipt_image|receiptImage|comment|payload/i,
  );
});
