"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

type MenuNoItemsStateProps = {
  isFiltering: boolean;
  onAddItem: () => void;
};

export function MenuNoItemsState({
  isFiltering,
  onAddItem,
}: MenuNoItemsStateProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="mx-auto max-w-[560px] rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] px-8 py-12 text-center">
      <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
        {isFiltering ? "∅" : "—"}
      </p>
      <h2 className="mt-3 font-[var(--f-display)] text-[22px] font-normal text-[var(--ink)]">
        {isFiltering ? t("noMatchTitle") : t("reviewEmptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-[380px] text-[14px] leading-[1.6] text-[var(--ink-2)]">
        {isFiltering ? t("noMatchDesc") : t("reviewEmptyDesc")}
      </p>
      {!isFiltering ? (
        <button
          type="button"
          onClick={onAddItem}
          className="mt-6 inline-flex items-center gap-2 rounded border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-[var(--f-ui)] text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
        >
          <Plus size={16} strokeWidth={1.5} />
          {t("table.add")}
        </button>
      ) : null}
    </div>
  );
}
