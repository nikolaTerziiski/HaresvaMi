"use client";

import { useTranslations } from "next-intl";

import type { MenuItemAlias } from "@/lib/menu/types";
import { cn } from "@/lib/utils";

const VISIBLE_ALIAS_LIMIT = 3;

type MenuAliasChipsProps = {
  aliases: MenuItemAlias[];
  canAddAlias: boolean;
  onAddAliasClick: () => void;
};

export function MenuAliasChips({
  aliases,
  canAddAlias,
  onAddAliasClick,
}: MenuAliasChipsProps) {
  const t = useTranslations("dashboard.menu.aliases");
  const visibleAliases = aliases.slice(0, VISIBLE_ALIAS_LIMIT);
  const hiddenCount = Math.max(aliases.length - visibleAliases.length, 0);

  if (aliases.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddAliasClick}
        disabled={!canAddAlias}
        title={!canAddAlias ? t("saveItemFirst") : undefined}
        className={cn(
          "inline-flex w-fit items-center rounded-md border border-dashed border-[var(--rule)] px-2 py-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition hover:border-[var(--ink-mute)] hover:text-[var(--ink)]",
          !canAddAlias &&
            "cursor-not-allowed opacity-45 hover:text-[var(--ink-mute)]",
        )}
      >
        {t("addChip")}
      </button>
    );
  }

  return (
    <div className="flex min-h-6 flex-wrap items-center gap-1.5">
      {visibleAliases.map((alias) => (
        <span
          key={alias.id}
          className="inline-flex max-w-[160px] items-center rounded-md bg-[var(--bg-2)] px-2 py-1 font-[var(--f-mono)] text-[11px] leading-none tracking-[0.02em] text-[var(--ink-2)]"
          title={alias.alias}
        >
          <span className="truncate">{alias.alias}</span>
        </span>
      ))}
      {hiddenCount > 0 ? (
        <span className="inline-flex items-center rounded-md border border-[var(--rule)] px-2 py-1 font-[var(--f-mono)] text-[10px] leading-none text-[var(--ink-mute)]">
          {t("moreChip", { count: hiddenCount })}
        </span>
      ) : null}
    </div>
  );
}
