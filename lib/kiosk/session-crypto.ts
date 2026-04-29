import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  KIOSK_TOKEN_BYTES,
  KIOSK_TOKEN_PREFIX,
} from "@/lib/kiosk/session-constants";
import { KioskSessionError } from "@/lib/kiosk/session-errors";

export function normalizeKioskToken(token: string) {
  const trimmed = token.trim();

  return trimmed.startsWith(KIOSK_TOKEN_PREFIX) ? trimmed : null;
}

export function createRawKioskToken() {
  return `${KIOSK_TOKEN_PREFIX}${randomBytes(KIOSK_TOKEN_BYTES).toString(
    "base64url",
  )}`;
}

export function hashKioskToken(token: string) {
  const normalized = normalizeKioskToken(token);

  if (!normalized) {
    throw new KioskSessionError(
      "invalid_token",
      "Kiosk token must use the ks_ prefix.",
    );
  }

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
