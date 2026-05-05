import "server-only";

import { createHash, randomBytes } from "node:crypto";

import {
  KIOSK_TOKEN_BYTES,
  KIOSK_TOKEN_BODY_LENGTH,
  KIOSK_TOKEN_PREFIX,
} from "@/lib/kiosk/session-constants";
import { KioskSessionError } from "@/lib/kiosk/session-errors";

const KIOSK_TOKEN_BODY_PATTERN = /^[A-Za-z0-9_-]+$/;

export function normalizeKioskToken(token: string) {
  const trimmed = token.trim();
  const body = trimmed.startsWith(KIOSK_TOKEN_PREFIX)
    ? trimmed.slice(KIOSK_TOKEN_PREFIX.length)
    : null;

  if (
    !body ||
    body.length !== KIOSK_TOKEN_BODY_LENGTH ||
    !KIOSK_TOKEN_BODY_PATTERN.test(body)
  ) {
    return null;
  }

  return trimmed;
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
      "Kiosk token must be a valid ks_ token.",
    );
  }

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}
