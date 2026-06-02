import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const aliasPopoverSource = readFileSync(
  join(process.cwd(), "components/dashboard/menu/AliasManagerPopover.tsx"),
  "utf8",
);

test("alias manager surfaces load, save, and delete failures", () => {
  assert.match(
    aliasPopoverSource,
    /setErrorMessage\(t\("aliasesLoadError"\)\)/,
  );
  assert.match(
    aliasPopoverSource,
    /setErrorMessage\(t\("aliasesSaveError"\)\)/,
  );
  assert.match(
    aliasPopoverSource,
    /setErrorMessage\(t\("aliasesDeleteError"\)\)/,
  );
  assert.match(aliasPopoverSource, /role="alert"/);
});

test("alias manager only removes deleted aliases after a successful response", () => {
  const fetchIndex = aliasPopoverSource.indexOf(
    "`/api/receipt-aliases/${encodeURIComponent(aliasId)}`",
  );
  const okGuardIndex = aliasPopoverSource.indexOf("if (!res.ok)", fetchIndex);
  const removeIndex = aliasPopoverSource.indexOf(
    "setAliases((prev) => prev.filter((a) => a.id !== aliasId))",
    okGuardIndex,
  );

  assert.notEqual(fetchIndex, -1, "Missing alias delete fetch");
  assert.notEqual(okGuardIndex, -1, "Missing non-ok delete guard");
  assert.notEqual(removeIndex, -1, "Missing successful delete removal");
  assert.ok(okGuardIndex > fetchIndex, "Delete response must be checked");
  assert.ok(
    removeIndex > okGuardIndex,
    "Alias should be removed after ok guard",
  );
});
