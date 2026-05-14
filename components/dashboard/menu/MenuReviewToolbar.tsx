"use client";

import { useTranslations } from "next-intl";
import { FolderPlus, RotateCcw, Search } from "lucide-react";

import type { CategoryFilter } from "@/lib/menu/types";

type MenuReviewToolbarProps = {
  searchQuery: string;
  selectedCategoryKey: string | null;
  allCategories: CategoryFilter[];
  totalItems: number;
  isSaving: boolean;
  onSearchQueryChange: (value: string) => void;
  onCategoryChange: (value: string | null) => void;
  onAddCategory: () => void;
  onStartOverClick: () => void;
};

export function MenuReviewToolbar({
  searchQuery,
  selectedCategoryKey,
  allCategories,
  totalItems,
  isSaving,
  onSearchQueryChange,
  onCategoryChange,
  onAddCategory,
  onStartOverClick,
}: MenuReviewToolbarProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="sticky top-0 z-30 mt-10 -mx-10 border-b border-[var(--rule)] bg-[var(--bg)] px-10 py-4 max-md:-mx-6 max-md:px-6 max-w-none">
      <div className="flex flex-wrap items-center gap-4">
        {/* Search */}
        <label className="relative flex max-w-[320px] flex-1 items-center">
          <Search
            size={16}
            strokeWidth={1.5}
            className="pointer-events-none absolute left-3 text-[var(--ink-mute)]"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-h-10 w-full rounded border border-[var(--rule)] bg-[var(--paper)] pl-9 pr-3 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)]"
          />
        </label>

        {/* Category chips */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onCategoryChange(null)}
            className={
              selectedCategoryKey === null
                ? "inline-flex items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]"
                : "inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
            }
          >
            {t("chipAll")}
            <span className="font-[var(--f-mono)] text-[11px] opacity-70">
              {totalItems}
            </span>
          </button>

          {allCategories.map((cat) => (
            <button
              key={cat.key || "__uncategorized"}
              type="button"
              onClick={() => onCategoryChange(cat.key)}
              className={
                selectedCategoryKey === cat.key
                  ? "inline-flex items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]"
                  : "inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
              }
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: cat.color }}
                aria-hidden
              />
              {cat.displayName || t("uncategorized")}
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* New category button */}
        <button
          type="button"
          onClick={onAddCategory}
          disabled={isSaving}
          className="ml-auto inline-flex items-center gap-1.5 rounded border border-[var(--accent)] px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--accent)] transition-colors hover:bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] disabled:pointer-events-none disabled:opacity-50"
        >
          <FolderPlus size={14} strokeWidth={1.5} />
          {t("newCategory")}
        </button>

        {/* Start over — ghost */}
        <button
          type="button"
          onClick={onStartOverClick}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] disabled:pointer-events-none disabled:opacity-50"
        >
          <RotateCcw size={14} strokeWidth={1.5} />
          {t("startOver")}
        </button>
      </div>
    </div>
  );
}
