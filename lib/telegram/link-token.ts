import "server-only";

import { createHmac } from "node:crypto";

/**
 * Telegram /start payload token for linking a restaurant to a Telegram chat.
 *
 * Encoding scheme (must fit ≤ 64 base64url chars):
 *   payload = <restaurantId_hex_compact>.<expEpochSeconds>.<sig_8bytes_base64url>
 *
 * restaurantId is a UUID (32 hex chars without dashes).
 * expEpochSeconds is a base36 number (~7 chars for year 2026+).
 * sig is 8 bytes (11 base64url chars) of HMAC-SHA256 over "rid.exp".
 *
 * Total budget:
 *   32 (rid) + 1 (.) + 7 (exp base36) + 1 (.) + 11 (sig) = 52 chars — fits 64.
 *
 * Note: 8-byte HMAC provides ~64 bits of security which is adequate for a
 * short-lived link that becomes invalid after TTL and is one-time-use by design.
 */

const HMAC_BYTES = 8; // 8 bytes → 11 base64url chars

function getSecret(): string {
  const secret = process.env.TELEGRAM_LINK_SECRET;
  if (!secret) {
    throw new Error("TELEGRAM_LINK_SECRET env var is not set.");
  }
  return secret;
}

/** Strip dashes from a UUID to get a compact 32-char hex string. */
function compactUuid(uuid: string): string {
  return uuid.replace(/-/g, "");
}

/** Restore dashes to a compact 32-char hex string to get a UUID. */
function expandHex(hex: string): string {
  if (hex.length !== 32) return "";
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join("-");
}

function computeSig(rid: string, exp: number): string {
  const secret = getSecret();
  const message = `${rid}.${exp}`;
  return createHmac("sha256", secret)
    .update(message, "utf8")
    .digest()
    .subarray(0, HMAC_BYTES)
    .toString("base64url");
}

/**
 * Sign a link token for the given restaurant.
 *
 * @param restaurantId - UUID of the restaurant
 * @param ttlSeconds   - Token lifetime in seconds (default: 900 = 15 min)
 * @returns A compact token safe to use as a Telegram /start payload (≤64 chars)
 */
export function signLinkToken(restaurantId: string, ttlSeconds = 900): string {
  const rid = compactUuid(restaurantId);
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const sig = computeSig(rid, exp);
  // Use base36 for exp to keep it short
  return `${rid}.${exp.toString(36)}.${sig}`;
}

/**
 * Verify a link token.
 *
 * @returns `{ valid: true, restaurantId }` or `{ valid: false }`
 */
export function verifyLinkToken(
  token: string,
): { valid: true; restaurantId: string } | { valid: false } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [rid, expBase36, sig] = parts;

    if (!rid || !expBase36 || !sig) return { valid: false };
    if (rid.length !== 32) return { valid: false };
    if (!/^[0-9a-f]{32}$/.test(rid)) return { valid: false };

    const exp = parseInt(expBase36, 36);
    if (isNaN(exp)) return { valid: false };

    const now = Math.floor(Date.now() / 1000);
    if (now > exp) return { valid: false };

    const expectedSig = computeSig(rid, exp);
    if (sig !== expectedSig) return { valid: false };

    const restaurantId = expandHex(rid);
    if (!restaurantId) return { valid: false };

    return { valid: true, restaurantId };
  } catch {
    return { valid: false };
  }
}
