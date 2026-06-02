import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const reputationPanelSource = source(
  "components/kiosk/scan/ReputationPanel.tsx",
);
const recoveryFormSource = source("components/kiosk/scan/RecoveryForm.tsx");
const kioskScanScreenSource = source("components/kiosk/KioskScanScreen.tsx");

// ── ReputationPanel ─────────────────────────────────────────────────────────

test("ReputationPanel does NOT import HappyReviewCta", () => {
  assert.doesNotMatch(reputationPanelSource, /HappyReviewCta/);
});

test("ReputationPanel renders RecoveryForm", () => {
  assert.match(reputationPanelSource, /<RecoveryForm/);
});

test("ReputationPanel checks sentiment === unhappy", () => {
  assert.match(reputationPanelSource, /sentiment === "unhappy"/);
});

test("ReputationPanel calls onDone defensively for non-unhappy sentiment", () => {
  assert.match(reputationPanelSource, /!isUnhappy/);
  assert.match(reputationPanelSource, /onDone\(\)/);
});

// ── RecoveryForm: compliance — no in-app Google review ─────────────────────

test("RecoveryForm contains NO reviewQrSvg prop or reference", () => {
  assert.doesNotMatch(recoveryFormSource, /reviewQrSvg/);
});

test("RecoveryForm contains NO reputationPublicLinkLabel", () => {
  assert.doesNotMatch(recoveryFormSource, /reputationPublicLinkLabel/);
});

test("RecoveryForm contains NO Google link / dangerouslySetInnerHTML QR injection", () => {
  assert.doesNotMatch(recoveryFormSource, /dangerouslySetInnerHTML/);
});

// ── RecoveryForm: correct structure ─────────────────────────────────────────

test("RecoveryForm contains recovery textarea", () => {
  assert.match(recoveryFormSource, /<textarea/);
  assert.match(recoveryFormSource, /copy\.recoveryPlaceholder/);
});

test("RecoveryForm has ~45s auto-advance timeout", () => {
  assert.match(recoveryFormSource, /45[_,]000/);
  assert.match(recoveryFormSource, /setTimeout/);
});

test("RecoveryForm timer only runs while comment is empty", () => {
  // The useEffect that sets the timer must guard on comment being empty
  assert.match(recoveryFormSource, /comment\.trim\(\)/);
});

test("RecoveryForm has recoverySkip button calling onDone", () => {
  assert.match(recoveryFormSource, /copy\.recoverySkip/);
  assert.match(recoveryFormSource, /onClick=\{onDone\}/);
});

test("RecoveryForm does NOT call onDone in a finally block (must not discard error)", () => {
  assert.doesNotMatch(recoveryFormSource, /finally\s*\{[^}]*onDone/);
});

// ── KioskScanScreen ──────────────────────────────────────────────────────────

test("KioskScanScreen treats reputation as customer-facing", () => {
  assert.match(
    kioskScanScreenSource,
    /flow\.mode === "customer"\s*\|\|\s*flow\.mode === "reputation"\s*\|\|\s*flow\.mode === "thanks"/,
  );
});

test("KioskScanScreen renders ReputationPanel for reputation mode", () => {
  assert.match(kioskScanScreenSource, /<ReputationPanel/);
  assert.match(kioskScanScreenSource, /flow\.mode === "reputation"/);
});

test("KioskScanScreen does NOT pass reviewQrSvg to ReputationPanel", () => {
  assert.doesNotMatch(kioskScanScreenSource, /reviewQrSvg/);
});
