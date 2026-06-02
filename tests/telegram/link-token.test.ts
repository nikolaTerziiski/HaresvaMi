import assert from "node:assert/strict";
import Module from "node:module";
import test from "node:test";

// Set env var before the module is loaded
process.env.TELEGRAM_LINK_SECRET = "test-secret-for-link-token-tests-only";

type ModuleWithLoad = typeof Module & {
  _load: (request: string, parent?: NodeJS.Module, isMain?: boolean) => unknown;
};

function shimServerOnly() {
  const moduleWithLoad = Module as ModuleWithLoad;
  const originalLoad = moduleWithLoad._load;

  moduleWithLoad._load = function loadWithServerOnlyShim(
    request,
    parent,
    isMain,
  ) {
    if (request === "server-only") {
      return {};
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  return () => {
    moduleWithLoad._load = originalLoad;
  };
}

type LinkTokenModule = typeof import("@/lib/telegram/link-token");

let modulePromise: Promise<LinkTokenModule> | undefined;

async function loadModule(): Promise<LinkTokenModule> {
  if (!modulePromise) {
    const restore = shimServerOnly();
    modulePromise = import("@/lib/telegram/link-token").finally(restore);
  }
  return modulePromise;
}

const SAMPLE_UUID = "550e8400-e29b-41d4-a716-446655440000";

test("sign → verify returns valid=true and correct restaurantId", async () => {
  const { signLinkToken, verifyLinkToken } = await loadModule();

  const token = signLinkToken(SAMPLE_UUID, 900);
  const result = verifyLinkToken(token);

  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.restaurantId, SAMPLE_UUID);
  }
});

test("token fits within 64 characters (Telegram /start payload limit)", async () => {
  const { signLinkToken } = await loadModule();

  const token = signLinkToken(SAMPLE_UUID, 900);
  assert.ok(
    token.length <= 64,
    `Token length ${token.length} exceeds 64 chars: "${token}"`,
  );
});

test("tampered signature → invalid", async () => {
  const { signLinkToken, verifyLinkToken } = await loadModule();

  const token = signLinkToken(SAMPLE_UUID, 900);
  const parts = token.split(".");
  // Reverse the signature segment to corrupt it
  parts[2] = parts[2]!.split("").reverse().join("");
  const tampered = parts.join(".");
  const result = verifyLinkToken(tampered);
  assert.equal(result.valid, false);
});

test("tampered restaurantId → invalid", async () => {
  const { signLinkToken, verifyLinkToken } = await loadModule();

  const token = signLinkToken(SAMPLE_UUID, 900);
  const parts = token.split(".");
  // Flip the last hex char of the rid
  const rid = parts[0]!;
  parts[0] = rid.slice(0, -1) + (rid.endsWith("0") ? "1" : "0");
  const tampered = parts.join(".");
  const result = verifyLinkToken(tampered);
  assert.equal(result.valid, false);
});

test("expired token (ttl=-1) → invalid", async () => {
  const { signLinkToken, verifyLinkToken } = await loadModule();

  const token = signLinkToken(SAMPLE_UUID, -1);
  const result = verifyLinkToken(token);
  assert.equal(result.valid, false);
});

test("completely bogus string → invalid", async () => {
  const { verifyLinkToken } = await loadModule();
  assert.equal(verifyLinkToken("not-a-valid-token").valid, false);
});

test("empty string → invalid", async () => {
  const { verifyLinkToken } = await loadModule();
  assert.equal(verifyLinkToken("").valid, false);
});
