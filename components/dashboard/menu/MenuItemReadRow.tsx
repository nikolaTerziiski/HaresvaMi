"use client";

import { useTranslations } from "next-intl";

import { parsePrice } from "@/lib/menu/format";
import { bgnToEur, formatEur } from "@/lib/menu/currency";
import type { MenuItemRow } from "@/lib/menu/types";

type MenuItemReadRowProps = {
  item: MenuItemRow;
};

export function MenuItemReadRow({ item }: MenuItemReadRowProps) {
  const t = useTranslations("dashboard.menu");

  const parsedPrice = parsePrice(item.price);
  const eurText =
    parsedPrice.valid && parsedPrice.value !== null
      ? t("eurAbbrev", { value: formatEur(bgnToEur(parsedPrice.value)) })
      : "—";

  return (
    <li className="flex items-start gap-4 px-6 py-4">
      {/* Name + description */}
      <div className="min-w-0 flex-1">
        <p className="text-[16px] font-medium text-[var(--ink)]">
          {item.name_bg}
        </p>
        {item.description_bg ? (
          <p className="mt-0.5 text-[13px] italic text-[var(--ink-mute)]">
            {item.description_bg}
          </p>
        ) : null}
      </div>

      {/* Price — static, tabular-nums, dual BGN/EUR */}
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-[var(--f-mono)] text-[18px] font-medium tabular-nums text-[var(--ink)]">
          {item.price ? `${item.price} лв` : "—"}
        </span>
        <span className="font-[var(--f-mono)] text-[12px] tabular-nums text-[var(--ink-mute)]">
          {eurText}
        </span>
      </div>
    </li>
  );
}
