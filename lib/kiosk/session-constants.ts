import "server-only";

export const KIOSK_TOKEN_PREFIX = "ks_";
export const KIOSK_TOKEN_BYTES = 32;
export const KIOSK_TOKEN_BODY_LENGTH = Math.ceil((KIOSK_TOKEN_BYTES * 8) / 6);
export const DEFAULT_KIOSK_SESSION_EXPIRY_DAYS = 30;
export const KIOSK_SESSION_COOKIE = "haresvami_kiosk_token";
export const KIOSK_SESSION_SELECT =
  "id, restaurant_id, label, status, expires_at, last_used_at, created_by, created_at";
