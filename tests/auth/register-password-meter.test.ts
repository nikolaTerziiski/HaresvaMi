import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const registerCssSource = readFileSync(
  join(process.cwd(), "app/(auth)/register/page.module.css"),
  "utf8",
);
const loginSource = readFileSync(
  join(process.cwd(), "app/(auth)/login/page.tsx"),
  "utf8",
);

test("registration password meter color classes beat the neutral segment rule", () => {
  assert.match(registerCssSource, /\.pwMeter i\.strengthWeak/);
  assert.match(registerCssSource, /\.pwMeter i\.strengthFair/);
  assert.match(registerCssSource, /\.pwMeter i\.strengthStrong/);
  assert.match(registerCssSource, /background-color: var\(--good\) !important/);
});

test("login screen does not calculate password strength", () => {
  assert.doesNotMatch(loginSource, /scorePassword/);
  assert.doesNotMatch(loginSource, /pwMeter/);
});
