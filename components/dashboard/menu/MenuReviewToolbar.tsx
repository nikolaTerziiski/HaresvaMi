"use client";

import { useTranslations } from "next-intl";
import { Check, FolderPlus, Pencil, RotateCcw, Search } from "lucide-react";

import { CategoryFilterDropdown } from "@/components/dashboard/menu/CategoryFilterDropdown";
import type { CategoryFilter } from "@/lib/menu/types";

type MenuReviewToolbarProps = {
  searchQuery: string;
  selectedCategoryKeys: string[] | null;
  allCategories: CategoryFilter[];
  totalItems: number;
  isSaving: boolean;
  editMode: boolean;
  onSearchQueryChange: (value: string) => void;
  onCategoryKeysChange: (value: string[] | null) => void;
  onAddCategory: () => void;
  onStartOverClick: () => void;
  onToggleEditMode: () => void;
};

export function MenuReviewToolbar({
  searchQuery,
  selectedCategoryKeys,
  allCategories,
  totalItems,
  isSaving,
  editMode,
  onSearchQueryChange,
  onCategoryKeysChange,
  onAddCategory,
  onStartOverClick,
  onToggleEditMode,
}: MenuReviewToolbarProps) {
  const t = useTranslations("dashboard.menu");

  const activeChipClass =
    "inline-flex items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]";
  const inactiveChipClass =
    "inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]";

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

        {/* Category filter dropdown */}
        <CategoryFilterDropdown
          allCategories={allCategories}
          selectedCategoryKeys={selectedCategoryKeys}
          onChange={onCategoryKeysChange}
          activeClass={activeChipClass}
          inactiveClass={inactiveChipClass}
        />

        {/* Total count badge */}
        <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)] opacity-70">
          {totalItems}
        </span>

        {/* Edit mode structural controls — only visible in edit mode */}
        {editMode ? (
          <>
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
          </>
        ) : (
          <span className="ml-auto" />
        )}

        {/* Edit / Done toggle */}
        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-50"
        >
          {editMode ? (
            <Check size={14} strokeWidth={1.5} />
          ) : (
            <Pencil size={14} strokeWidth={1.5} />
          )}
          {editMode ? t("editToggle.done") : t("editToggle.edit")}
        </button>
      </div>
    </div>
  );
}
