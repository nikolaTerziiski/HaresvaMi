import "server-only";

import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { normalizeReceiptAlias } from "@/lib/receipt-aliases/normalize";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export const aliasTextSchema = z
  .string()
  .min(1, "Alias text cannot be empty.")
  .max(64, "Alias text cannot exceed 64 characters.");

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReceiptAliasRow = {
  id: string;
  alias_text: string;
  confidence: string;
  created_at: string;
};

// ---------------------------------------------------------------------------
// List aliases for a single menu item, scoped to a restaurant
// ---------------------------------------------------------------------------

export async function listAliasesForMenuItem({
  restaurantId,
  menuItemId,
}: {
  restaurantId: string;
  menuItemId: string;
}): Promise<ReceiptAliasRow[]> {
  const supabase = createSupabaseServiceClient();

  const { data, error } = await supabase
    .from("receipt_aliases")
    .select("id, alias, confidence, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("menu_item_id", menuItemId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to list aliases: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    alias_text: row.alias,
    confidence: row.confidence,
    created_at: row.created_at,
  }));
}

// ---------------------------------------------------------------------------
// Add a manual alias for a menu item
// ---------------------------------------------------------------------------

export type AddAliasResult =
  | { ok: true; alias: ReceiptAliasRow }
  | { ok: false; code: "duplicate" | "write_failed" | "invalid_menu_item" };

export async function addManualAlias({
  restaurantId,
  menuItemId,
  rawText,
}: {
  restaurantId: string;
  menuItemId: string;
  rawText: string;
}): Promise<AddAliasResult> {
  const normalizedAlias = normalizeReceiptAlias(rawText);
  const supabase = createSupabaseServiceClient();

  // Verify the menu item belongs to this restaurant and is active
  const { data: menuItem, error: menuError } = await supabase
    .from("menu_items")
    .select("id")
    .eq("id", menuItemId)
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .maybeSingle();

  if (menuError) {
    return { ok: false, code: "write_failed" };
  }

  if (!menuItem) {
    return { ok: false, code: "invalid_menu_item" };
  }

  // Check for duplicate alias text within this restaurant
  const { data: existing, error: checkError } = await supabase
    .from("receipt_aliases")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("alias", normalizedAlias)
    .maybeSingle();

  if (checkError) {
    return { ok: false, code: "write_failed" };
  }

  if (existing) {
    return { ok: false, code: "duplicate" };
  }

  // Insert the new alias
  const { data: inserted, error: insertError } = await supabase
    .from("receipt_aliases")
    .insert({
      restaurant_id: restaurantId,
      alias: normalizedAlias,
      menu_item_id: menuItemId,
      confidence: "manual",
      times_seen: 1,
      last_seen_at: new Date().toISOString(),
    })
    .select("id, alias, confidence, created_at")
    .single();

  if (insertError || !inserted) {
    return { ok: false, code: "write_failed" };
  }

  return {
    ok: true,
    alias: {
      id: inserted.id,
      alias_text: inserted.alias,
      confidence: inserted.confidence,
      created_at: inserted.created_at,
    },
  };
}

// ---------------------------------------------------------------------------
// Delete a single alias by id, scoped to a restaurant
// ---------------------------------------------------------------------------

export type DeleteAliasResult =
  | { ok: true }
  | { ok: false; code: "not_found" | "write_failed" };

export async function deleteAlias({
  restaurantId,
  aliasId,
}: {
  restaurantId: string;
  aliasId: string;
}): Promise<DeleteAliasResult> {
  const supabase = createSupabaseServiceClient();

  // Verify ownership before deleting
  const { data: existing, error: checkError } = await supabase
    .from("receipt_aliases")
    .select("id")
    .eq("id", aliasId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (checkError) {
    return { ok: false, code: "write_failed" };
  }

  if (!existing) {
    return { ok: false, code: "not_found" };
  }

  const { error: deleteError } = await supabase
    .from("receipt_aliases")
    .delete()
    .eq("id", aliasId)
    .eq("restaurant_id", restaurantId);

  if (deleteError) {
    return { ok: false, code: "write_failed" };
  }

  return { ok: true };
}
