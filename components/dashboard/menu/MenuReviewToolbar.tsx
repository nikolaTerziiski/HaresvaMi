"use client";

import { useTranslations } from "next-intl";
import { RotateCcw, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { CategoryFilter } from "@/lib/menu/types";

type MenuReviewToolbarProps = {
  searchQuery: string;
  selectedCategoryKey: string | null;
  allCategories: CategoryFilter[];
  totalItems: number;
  isSaving: boolean;
  onSearchQueryChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onStartOverClick: () => void;
};

function chipClass(active: boolean) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition";

  if (active) {
    return `${base} border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]`;
  }

  return `${base} border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-2)] hover:border-[var(--ink-mute)] hover:text-[var(--ink)]`;
}

export function MenuReviewToolbar({
  searchQuery,
  selectedCategoryKey,
  allCategories,
  totalItems,
  isSaving,
  onSearchQueryChange,
  onCategoryChange,
  onStartOverClick,
}: MenuReviewToolbarProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="sticky top-[56px] z-30 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] px-9 py-2.5 backdrop-blur-sm max-md:px-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex w-[280px] items-center gap-2 rounded-lg border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 text-[var(--ink-mute)] max-md:w-full">
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          <input
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
          />
        </div>

        <div className="ml-1 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={chipClass(selectedCategoryKey === null)}
          >
            {t("chipAll")}
            <span className="font-[var(--f-mono)] text-[10px] opacity-70">
              {totalItems}
            </span>
          </button>
          {allCategories.map((category) => (
            <button
              key={category.key || "__uncategorized"}
              type="button"
              onClick={() => onCategoryChange(category.key)}
              className={chipClass(selectedCategoryKey === category.key)}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: category.color }}
              />
              {category.displayName || t("uncategorized")}
              <span className="font-[var(--f-mono)] text-[10px] opacity-70">
                {category.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <Button
          variant="outline"
          onClick={onStartOverClick}
          disabled={isSaving}
          className="h-8 gap-1.5 px-3 text-[13px]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t("startOver")}
        </Button>
      </div>
    </div>
  );
}
