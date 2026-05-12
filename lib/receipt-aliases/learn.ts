import "server-only";

import { z } from "zod";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { normalizeReceiptAlias } from "@/lib/receipt-aliases/normalize";

export const receiptAliasLearnSchema = z.object({
  aliases: z
    .array(
      z.object({
        rawText: z.string().min(1),
        menuItemId: z.string().uuid(),
      }),
    )
    .min(1),
});

type ReceiptAliasLearnInput = {
  restaurantId: string;
  aliases: z.infer<typeof receiptAliasLearnSchema>["aliases"];
};

export type LearnedReceiptAlias = {
  alias: string;
  rawText: string;
  menuItemId: string;
  timesSeen: number;
};

export class ReceiptAliasLearningError extends Error {
  constructor(
    public code: "empty_alias" | "invalid_menu_item" | "write_failed",
    message: string,
  ) {
    super(message);
    this.name = "ReceiptAliasLearningError";
  }
}

export function responseForReceiptAliasLearningError(
  error: ReceiptAliasLearningError,
) {
  if (error.code === "invalid_menu_item") {
    return {
      status: 404,
      body: {
        error: error.code,
        message: "Menu item is not active for this restaurant.",
      },
    };
  }

  return {
    status: error.code === "empty_alias" ? 400 : 500,
    body: {
      error: error.code,
      message: error.message,
    },
  };
}

export async function learnReceiptAliases({
  restaurantId,
  aliases,
}: ReceiptAliasLearnInput): Promise<{ learnedAliases: LearnedReceiptAlias[] }> {
  const normalizedAliases = aliases.map((item) => ({
    rawText: item.rawText,
    alias: normalizeReceiptAlias(item.rawText),
    menuItemId: item.menuItemId,
  }));

  if (normalizedAliases.some((item) => item.alias.length === 0)) {
    throw new ReceiptAliasLearningError(
      "empty_alias",
      "Receipt alias cannot be empty.",
    );
  }

  const supabase = createSupabaseServiceClient();
  const menuItemIds = Array.from(
    new Set(normalizedAliases.map((item) => item.menuItemId)),
  );
  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("id", menuItemIds);

  if (menuError) {
    throw new ReceiptAliasLearningError("write_failed", menuError.message);
  }

  const validMenuItemIds = new Set((menuItems ?? []).map((item) => item.id));

  if (
    normalizedAliases.some((item) => !validMenuItemIds.has(item.menuItemId))
  ) {
    throw new ReceiptAliasLearningError(
      "invalid_menu_item",
      "Menu item does not belong to this restaurant or is inactive.",
    );
  }

  const learnedAliases: LearnedReceiptAlias[] = [];

  for (const item of normalizedAliases) {
    const { data: existing, error: readError } = await supabase
      .from("receipt_aliases")
      .select("id, times_seen")
      .eq("restaurant_id", restaurantId)
      .eq("alias", item.alias)
      .maybeSingle();

    if (readError) {
      throw new ReceiptAliasLearningError("write_failed", readError.message);
    }

    const nextTimesSeen = (existing?.times_seen ?? 0) + 1;
    const { error: writeError } = await supabase.from("receipt_aliases").upsert(
      {
        restaurant_id: restaurantId,
        alias: item.alias,
        menu_item_id: item.menuItemId,
        confidence: "manual",
        times_seen: nextTimesSeen,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "restaurant_id,alias" },
    );

    if (writeError) {
      throw new ReceiptAliasLearningError("write_failed", writeError.message);
    }

    learnedAliases.push({
      alias: item.alias,
      rawText: item.rawText,
      menuItemId: item.menuItemId,
      timesSeen: nextTimesSeen,
    });
  }

  return { learnedAliases };
}
