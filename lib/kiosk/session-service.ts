import "server-only";

import type { KioskSession } from "@/lib/kiosk/session-types";
import {
  DEFAULT_KIOSK_SESSION_EXPIRY_DAYS,
  KIOSK_SESSION_SELECT,
} from "@/lib/kiosk/session-constants";
import {
  createRawKioskToken,
  hashKioskToken,
  normalizeKioskToken,
} from "@/lib/kiosk/session-crypto";
import { KioskSessionError } from "@/lib/kiosk/session-errors";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

type CreateKioskSessionInput = {
  restaurantId: string;
  ownerId: string;
  label?: string | null;
  expiresInDays?: number;
};

type OwnerKioskSessionInput = {
  restaurantId: string;
  ownerId: string;
};

export type VerifyKioskTokenResult =
  | {
      valid: true;
      session: KioskSession;
    }
  | {
      valid: false;
      reason: "invalid_format" | "not_found" | "revoked" | "expired";
    };

function normalizeLabel(label: string | null | undefined) {
  const trimmed = label?.trim();

  return trimmed ? trimmed : null;
}

function expiryDate(expiresInDays = DEFAULT_KIOSK_SESSION_EXPIRY_DAYS) {
  if (!Number.isFinite(expiresInDays) || expiresInDays <= 0) {
    throw new KioskSessionError(
      "invalid_expiry",
      "Kiosk session expiry must be a positive number of days.",
    );
  }

  return new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);
}

function isExpired(expiresAt: string, now: Date) {
  const expiresAtMs = Date.parse(expiresAt);

  return !Number.isFinite(expiresAtMs) || expiresAtMs <= now.getTime();
}

async function assertOwnerRestaurant(restaurantId: string, ownerId: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("id")
    .eq("id", restaurantId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    throw new KioskSessionError(
      "create_failed",
      `Unable to verify kiosk session restaurant: ${error.message}`,
    );
  }

  if (!data) {
    throw new KioskSessionError(
      "restaurant_not_found",
      "Restaurant does not belong to this owner.",
    );
  }
}

function asKioskSession(row: unknown) {
  return row as KioskSession;
}

export async function createKioskSession({
  restaurantId,
  ownerId,
  label,
  expiresInDays,
}: CreateKioskSessionInput) {
  await assertOwnerRestaurant(restaurantId, ownerId);

  const supabase = createSupabaseServiceClient();
  const token = createRawKioskToken();
  const expiresAt = expiryDate(expiresInDays).toISOString();
  const { data, error } = await supabase
    .from("kiosk_sessions")
    .insert({
      restaurant_id: restaurantId,
      token_hash: hashKioskToken(token),
      label: normalizeLabel(label),
      expires_at: expiresAt,
      created_by: ownerId,
    })
    .select(KIOSK_SESSION_SELECT)
    .single();

  if (error) {
    throw new KioskSessionError(
      "create_failed",
      `Unable to create kiosk session: ${error.message}`,
    );
  }

  return {
    token,
    session: asKioskSession(data),
  };
}

export async function listKioskSessions({
  restaurantId,
  ownerId,
}: OwnerKioskSessionInput) {
  await assertOwnerRestaurant(restaurantId, ownerId);

  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase
    .from("kiosk_sessions")
    .select(KIOSK_SESSION_SELECT)
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new KioskSessionError(
      "verify_failed",
      `Unable to list kiosk sessions: ${error.message}`,
    );
  }

  return (data ?? []).map(asKioskSession);
}

export async function verifyKioskToken(
  token: string,
): Promise<VerifyKioskTokenResult> {
  const normalized = normalizeKioskToken(token);

  if (!normalized) {
    return {
      valid: false,
      reason: "invalid_format",
    };
  }

  const supabase = createSupabaseServiceClient();
  const nowDate = new Date();
  const now = nowDate.toISOString();
  const { data, error } = await supabase
    .from("kiosk_sessions")
    .select(KIOSK_SESSION_SELECT)
    .eq("token_hash", hashKioskToken(normalized))
    .maybeSingle();

  if (error) {
    throw new KioskSessionError(
      "verify_failed",
      `Unable to verify kiosk session: ${error.message}`,
    );
  }

  if (!data) {
    return {
      valid: false,
      reason: "not_found",
    };
  }

  if (data.status !== "active") {
    return {
      valid: false,
      reason: "revoked",
    };
  }

  if (isExpired(data.expires_at, nowDate)) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("kiosk_sessions")
    .update({ last_used_at: now })
    .eq("id", data.id)
    .eq("status", "active")
    .gt("expires_at", now)
    .select(KIOSK_SESSION_SELECT)
    .maybeSingle();

  if (updateError) {
    throw new KioskSessionError(
      "verify_failed",
      `Unable to update kiosk session usage: ${updateError.message}`,
    );
  }

  if (!updated) {
    return {
      valid: false,
      reason: "expired",
    };
  }

  return {
    valid: true,
    session: asKioskSession(updated),
  };
}

export async function revokeKioskSession(sessionId: string, ownerId: string) {
  const supabase = createSupabaseServiceClient();
  const { data: session, error: sessionError } = await supabase
    .from("kiosk_sessions")
    .select(KIOSK_SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError) {
    throw new KioskSessionError(
      "revoke_failed",
      `Unable to load kiosk session: ${sessionError.message}`,
    );
  }

  if (!session) {
    return null;
  }

  await assertOwnerRestaurant(session.restaurant_id, ownerId);

  const { data, error } = await supabase
    .from("kiosk_sessions")
    .update({ status: "revoked" })
    .eq("id", sessionId)
    .select(KIOSK_SESSION_SELECT)
    .single();

  if (error) {
    throw new KioskSessionError(
      "revoke_failed",
      `Unable to revoke kiosk session: ${error.message}`,
    );
  }

  return asKioskSession(data);
}
