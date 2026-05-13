import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function readFiles(directory: string): string {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        return readFiles(entryPath);
      }

      return entry.isFile() && /\.(tsx?|json)$/.test(entry.name)
        ? readFileSync(entryPath, "utf8")
        : "";
    })
    .join("\n");
}

const menuUiSource = [
  readFiles(join(process.cwd(), "components/dashboard/menu")),
  readFileSync(join(process.cwd(), "hooks/useMenuAliasManager.ts"), "utf8"),
  readFileSync(join(process.cwd(), "lib/i18n/messages/bg.json"), "utf8"),
].join("\n");

test("owner menu alias UI uses the product-approved title", () => {
  assert.match(menuUiSource, /Псевдоними на ястия/);
  assert.doesNotMatch(menuUiSource, /Речник на бона/);
});

test("owner menu rows show alias chips and the compact add action", () => {
  assert.match(menuUiSource, /MenuAliasChips/);
  assert.match(menuUiSource, /\+ псевдоним/);
  assert.match(menuUiSource, /\+ още \{count\}/);
});
