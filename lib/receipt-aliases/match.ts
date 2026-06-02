import { normalizeReceiptAlias } from "@/lib/receipt-aliases/normalize";
import type { ExtractedReceiptItem } from "@/lib/ai/providers/gemini-receipt";

type MenuItemLite = { id: string; name_bg: string };
type AliasLite = { alias: string; menu_item_id: string };

/**
 * Deterministic alias override for receipt extraction.
 *
 * The model is *asked* to "use aliases first", but it is not guaranteed to. This
 * pass turns a known alias into an actual rule: if a receipt line — normalized
 * the same way aliases are stored (trim + collapse whitespace + UPPERCASE bg-BG)
 * — exactly equals a stored alias whose menu item is still active, we force the
 * match to that dish with `matched_via: "alias"`, regardless of what the model
 * returned. This makes short codes ("ПФ", "КБ") map reliably and keeps the
 * learn-on-correction logic honest (it skips rows already matched via an alias).
 *
 * Aliases pointing at inactive/deleted menu items are ignored (there is no menu
 * name to resolve), so we never override a model match with a dead dish.
 *
 * Pure function — no I/O — so the caller passes the already-loaded menu + aliases.
 */
export function applyDeterministicAliasMatches(
  items: ExtractedReceiptItem[],
  menu: MenuItemLite[],
  aliases: AliasLite[],
): ExtractedReceiptItem[] {
  if (aliases.length === 0) return items;

  const nameById = new Map(menu.map((m) => [m.id, m.name_bg]));

  // Map normalized alias -> active menu item id. Stored aliases are already
  // normalized, but normalize again so a key always equals
  // normalizeReceiptAlias(raw_text). First alias wins (the unique
  // (restaurant_id, alias) constraint makes collisions rare).
  const itemIdByAlias = new Map<string, string>();
  for (const a of aliases) {
    const key = normalizeReceiptAlias(a.alias);
    if (key && nameById.has(a.menu_item_id) && !itemIdByAlias.has(key)) {
      itemIdByAlias.set(key, a.menu_item_id);
    }
  }

  if (itemIdByAlias.size === 0) return items;

  return items.map((item): ExtractedReceiptItem => {
    const targetId = itemIdByAlias.get(normalizeReceiptAlias(item.raw_text));
    if (!targetId) return item;

    return {
      ...item,
      menu_item_id: targetId,
      menu_item_name: nameById.get(targetId) ?? item.menu_item_name,
      matched_via: "alias",
    };
  });
}
