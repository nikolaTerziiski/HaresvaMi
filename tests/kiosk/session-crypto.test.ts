import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import Module from "node:module";
import test from "node:test";

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

let cryptoModulePromise:
  | Promise<typeof import("@/lib/kiosk/session-crypto")>
  | undefined;

async function loadCryptoModule() {
  if (!cryptoModulePromise) {
    const restoreServerOnlyShim = shimServerOnly();

    cryptoModulePromise = import("@/lib/kiosk/session-crypto").finally(
      restoreServerOnlyShim,
    );
  }

  return cryptoModulePromise;
}

const tokenBodyLength = 43;
const validToken = `ks_${"A".repeat(tokenBodyLength)}`;
const tokenPattern = /^ks_[A-Za-z0-9_-]{43}$/;

test("createRawKioskToken returns a token with ks_ prefix", async () => {
  const { createRawKioskToken } = await loadCryptoModule();

  assert.equal(createRawKioskToken().startsWith("ks_"), true);
});

test("generated token has expected base64url-safe format", async () => {
  const { createRawKioskToken } = await loadCryptoModule();

  assert.match(createRawKioskToken(), tokenPattern);
});

test("hashKioskToken returns a deterministic SHA-256 hex string", async () => {
  const { hashKioskToken } = await loadCryptoModule();
  const first = hashKioskToken(validToken);
  const second = hashKioskToken(validToken);
  const expected = createHash("sha256")
    .update(validToken, "utf8")
    .digest("hex");

  assert.equal(first, second);
  assert.equal(first, expected);
  assert.match(first, /^[a-f0-9]{64}$/);
});

test("hashKioskToken rejects tokens without ks_ prefix", async () => {
  const { hashKioskToken } = await loadCryptoModule();

  assert.throws(() => hashKioskToken("not-a-kiosk-token"));
});

test("normalizeKioskToken rejects malformed and oversized tokens", async () => {
  const { normalizeKioskToken } = await loadCryptoModule();

  assert.equal(normalizeKioskToken("not-a-kiosk-token"), null);
  assert.equal(
    normalizeKioskToken(`ks_${"A".repeat(tokenBodyLength - 1)}`),
    null,
  );
  assert.equal(
    normalizeKioskToken(`ks_${"A".repeat(tokenBodyLength + 1)}`),
    null,
  );
  assert.equal(
    normalizeKioskToken(`ks_${"A".repeat(tokenBodyLength - 1)}!`),
    null,
  );
  assert.equal(normalizeKioskToken("ks_"), null);
});

test("normalizeKioskToken accepts trimmed valid tokens", async () => {
  const { normalizeKioskToken } = await loadCryptoModule();

  assert.equal(normalizeKioskToken(` ${validToken}\n`), validToken);
});
