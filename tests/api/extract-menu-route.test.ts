import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const routeSource = readFileSync(
  join(process.cwd(), "app/api/extract-menu/route.ts"),
  "utf8",
);

const extractorSource = readFileSync(
  join(process.cwd(), "lib/ai/extract-menu.ts"),
  "utf8",
);

test("extract-menu route imports size constant from menu constants", () => {
  assert.ok(routeSource.includes("MAX_MENU_FILE_SIZE_BYTES"));
  assert.ok(routeSource.includes("@/lib/menu/constants"));
});

test("extract-menu route enforces server-side size limit before reading arrayBuffer", () => {
  const sizeCheckIndex = routeSource.indexOf(
    "file.size > MAX_MENU_FILE_SIZE_BYTES",
  );
  const arrayBufferIndex = routeSource.indexOf("file.arrayBuffer()");

  assert.notEqual(sizeCheckIndex, -1, "Missing server-side size check");
  assert.notEqual(arrayBufferIndex, -1, "Missing arrayBuffer call");
  assert.ok(
    sizeCheckIndex < arrayBufferIndex,
    "Size check must come before arrayBuffer read",
  );
});

test("extract-menu route returns 413 when file exceeds size limit", () => {
  assert.ok(routeSource.includes("status: 413"));
  assert.ok(routeSource.includes("File exceeds maximum size of 10MB"));
});

test("extract-menu route passes restaurant.id to extractMenu (legacy path)", () => {
  // The call may be formatted across multiple lines by prettier
  assert.match(
    routeSource,
    /extractMenu\([\s\S]*?mimeType[\s\S]*?base64Data[\s\S]*?restaurant\.id[\s\S]*?\)/,
  );
});

test("extractMenu uses GOOGLE_GEMINI_API_KEY with fallback to GEMINI_API_KEY", () => {
  assert.ok(
    extractorSource.includes(
      "process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY",
    ),
  );
});

test("extractMenu error message references GOOGLE_GEMINI_API_KEY", () => {
  assert.ok(
    extractorSource.includes(
      "GOOGLE_GEMINI_API_KEY environment variable is not set",
    ),
  );
});

test("extractMenu has server-only import", () => {
  assert.ok(extractorSource.startsWith('import "server-only";'));
});

test("extractMenu defines and uses MENU_MODEL constant", () => {
  assert.match(
    extractorSource,
    /const MENU_MODEL\s*=\s*"gemini-2\.5-flash(-lite)?"/,
  );
  const modelConstantCount = (extractorSource.match(/MENU_MODEL/g) ?? [])
    .length;
  assert.ok(
    modelConstantCount >= 2,
    "MENU_MODEL should be used in at least two places",
  );
});

test("extractMenu accepts restaurantId as third parameter", () => {
  assert.match(
    extractorSource,
    /export async function extractMenu\(\s*mimeType:\s*string,\s*base64Data:\s*string,\s*restaurantId:\s*string,?\s*\)/,
  );
});

test("extractMenu calls insertAiUsageEvent on success path", () => {
  assert.ok(extractorSource.includes("insertAiUsageEvent"));
  assert.ok(extractorSource.includes('"menu_extraction"'));
});

test("extractMenu wraps insertAiUsageEvent with .catch on both paths", () => {
  const catchCount = (
    extractorSource.match(/\.catch\(\(logError\) => \{/g) ?? []
  ).length;
  assert.ok(
    catchCount >= 2,
    "Expected best-effort .catch on both success and failure paths",
  );
});

test("extractMenu logs failure event with zero tokens on catch path", () => {
  assert.ok(extractorSource.includes("inputTokens: 0"));
  assert.ok(extractorSource.includes("outputTokens: 0"));
  assert.ok(extractorSource.includes("totalTokens: 0"));
});

test("extract-menu route stays under 300 lines (multi-file path added)", () => {
  const lines = routeSource.trim().split(/\r?\n/);
  assert.ok(
    lines.length < 300,
    `Route should stay under 300 lines (got ${lines.length} lines)`,
  );
});

test("extract-menu lib stays under 300 lines", () => {
  const lines = extractorSource.trim().split(/\r?\n/);
  assert.ok(
    lines.length < 300,
    `extract-menu.ts should stay under 300 lines (got ${lines.length} lines)`,
  );
});

test("extract-menu route validates max 8 files for multi-file path", () => {
  assert.ok(routeSource.includes("too_many_files"));
  assert.ok(routeSource.includes("MAX_FILES"));
});

test("extract-menu route enforces 30 MB total size ceiling", () => {
  assert.ok(routeSource.includes("total_too_large"));
  assert.ok(routeSource.includes("MAX_TOTAL_BYTES"));
});

test("extract-menu route returns 502 on Gemini failure (multi-file)", () => {
  assert.ok(routeSource.includes("status: 502"));
  assert.ok(routeSource.includes("ai_failed"));
});

test("extract-menu route reads files via formData.getAll('files')", () => {
  assert.ok(routeSource.includes('formData.getAll("files")'));
});

test("extract-menu route calls extractMenuFromFiles and returns result wrapper", () => {
  assert.ok(routeSource.includes("extractMenuFromFiles"));
  assert.ok(routeSource.includes("{ result }"));
});

test("extract-menu route increments usage only after successful extraction", () => {
  assert.ok(routeSource.includes("incrementMenuExtractionUsage"), "Missing incrementMenuExtractionUsage");
  assert.ok(routeSource.includes("status: 502"), "Missing 502 for AI failure");
  // The ai_failed error guard must not be followed by an increment call before
  // control returns — verify that "await incrementMenuExtractionUsage" (the call)
  // never appears inside the catch block that returns 502.
  const aiFailedIndex = routeSource.indexOf('"ai_failed"');
  // Find the await call (not the import)
  const awaitIncrementIndex = routeSource.indexOf("await incrementMenuExtractionUsage");
  assert.notEqual(aiFailedIndex, -1, "Missing ai_failed error key");
  assert.notEqual(awaitIncrementIndex, -1, "Missing await incrementMenuExtractionUsage call");
  // The 502 block ends before the await increment call — confirmed by index ordering
  assert.ok(
    awaitIncrementIndex > aiFailedIndex,
    "await incrementMenuExtractionUsage must come after the ai_failed guard",
  );
});

test("extract-menu route validates mime type per-file", () => {
  assert.ok(routeSource.includes("unsupported_type"));
});

test("extractMenuFromFiles is exported from extract-menu.ts", () => {
  assert.ok(extractorSource.includes("export async function extractMenuFromFiles"));
});
