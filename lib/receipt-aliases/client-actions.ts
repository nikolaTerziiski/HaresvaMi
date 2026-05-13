"use client";

import type { MenuItemAlias } from "@/lib/menu/types";

type LearnedReceiptAliasResponse = {
  id?: string;
  alias: string;
  menuItemId: string;
  confidence?: MenuItemAlias["confidence"];
  timesSeen: number;
};

type ReceiptAliasLearnResponse = {
  learnedAliases?: LearnedReceiptAliasResponse[];
  error?: string;
  message?: string;
};

export async function saveManualReceiptAlias({
  rawText,
  menuItemId,
  errorMessage,
}: {
  rawText: string;
  menuItemId: string;
  errorMessage: string;
}): Promise<MenuItemAlias> {
  const response = await fetch("/api/receipt-aliases/learn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      aliases: [
        {
          rawText,
          menuItemId,
        },
      ],
    }),
  });
  const data = (await response
    .json()
    .catch(() => null)) as ReceiptAliasLearnResponse | null;

  if (!response.ok) {
    throw new Error(data?.message || data?.error || errorMessage);
  }

  const learnedAlias = data?.learnedAliases?.[0];

  if (!learnedAlias) {
    throw new Error(errorMessage);
  }

  return {
    id: learnedAlias.id ?? `${learnedAlias.menuItemId}:${learnedAlias.alias}`,
    alias: learnedAlias.alias,
    menu_item_id: learnedAlias.menuItemId,
    confidence: learnedAlias.confidence ?? "manual",
    times_seen: learnedAlias.timesSeen,
  };
}
