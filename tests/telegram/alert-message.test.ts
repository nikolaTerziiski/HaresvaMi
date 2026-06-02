import assert from "node:assert/strict";
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
    // Stub server-only guard
    if (request === "server-only") {
      return {};
    }
    // Stub Supabase to avoid connection errors (not needed for pure fn test)
    if (
      request.includes("@/lib/supabase/server") ||
      request.includes("supabase/server")
    ) {
      return {
        createSupabaseServiceClient: () => ({}),
        createSupabaseServerClient: async () => ({}),
      };
    }
    // Stub sendTelegramMessage (not needed for pure fn test)
    if (
      request.includes("@/lib/telegram/send") ||
      request.includes("telegram/send")
    ) {
      return { sendTelegramMessage: async () => ({ ok: true }) };
    }
    return originalLoad.call(this, request, parent, isMain);
  };

  return () => {
    moduleWithLoad._load = originalLoad;
  };
}

type NotifyModule = typeof import("@/lib/reputation/notify");

let modulePromise: Promise<NotifyModule> | undefined;

async function loadModule(): Promise<NotifyModule> {
  if (!modulePromise) {
    const restore = shimServerOnly();
    modulePromise = import("@/lib/reputation/notify").finally(restore);
  }
  return modulePromise;
}

const RESTAURANT_NAME = "Златното пиле";
const DASHBOARD_URL = "https://haresvami.bg/dashboard/feedback";

test("includes the restaurant name in the message", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg = buildLowRatingAlertMessage(RESTAURANT_NAME, DASHBOARD_URL);
  assert.ok(
    msg.includes(RESTAURANT_NAME),
    `Expected message to include restaurant name. Got: "${msg}"`,
  );
});

test("includes the dashboard URL in the message", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg = buildLowRatingAlertMessage(RESTAURANT_NAME, DASHBOARD_URL);
  assert.ok(
    msg.includes(DASHBOARD_URL),
    `Expected message to include dashboard URL. Got: "${msg}"`,
  );
});

test("does NOT include customer comment text or PII markers", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg = buildLowRatingAlertMessage(RESTAURANT_NAME, DASHBOARD_URL);
  const piiTerms = ["коментар", "email", "@", "uuid", "customer", "клиент"];
  for (const term of piiTerms) {
    assert.ok(
      !msg.toLowerCase().includes(term),
      `Message must not include "${term}". Got: "${msg}"`,
    );
  }
});

test("does NOT include recovery-flow text", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg = buildLowRatingAlertMessage(RESTAURANT_NAME, DASHBOARD_URL);
  const recoveryTerms = ["recovery", "recuper", "restore", "възстанов"];
  for (const term of recoveryTerms) {
    assert.ok(
      !msg.toLowerCase().includes(term),
      `Message must not include recovery term "${term}". Got: "${msg}"`,
    );
  }
});

test("message is a non-empty string", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg = buildLowRatingAlertMessage(RESTAURANT_NAME, DASHBOARD_URL);
  assert.ok(typeof msg === "string" && msg.length > 0);
});

test("different restaurant names produce different messages", async () => {
  const { buildLowRatingAlertMessage } = await loadModule();
  const msg1 = buildLowRatingAlertMessage("Ресторант А", DASHBOARD_URL);
  const msg2 = buildLowRatingAlertMessage("Ресторант Б", DASHBOARD_URL);
  assert.notEqual(msg1, msg2);
});
