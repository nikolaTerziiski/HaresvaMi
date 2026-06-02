"use client";

import { useTranslations } from "next-intl";
import { Eye, FolderPlus, Pencil, RotateCcw, Search } from "lucide-react";

import { CategoryFilterDropdown } from "@/components/dashboard/menu/CategoryFilterDropdown";
import type { CategoryFilter } from "@/lib/menu/types";

type MenuReviewToolbarProps = {
  searchQuery: string;
  selectedCategoryKeys: string[] | null;
  allCategories: CategoryFilter[];
  isSaving: boolean;
  editMode: boolean;
  canEditCategories: boolean;
  onSearchQueryChange: (value: string) => void;
  onCategoryKeysChange: (value: string[] | null) => void;
  onEditCategories: () => void;
  onAddCategory: () => void;
  onStartOverClick: () => void;
  onToggleEditMode: () => void;
};

export function MenuReviewToolbar({
  searchQuery,
  selectedCategoryKeys,
  allCategories,
  isSaving,
  editMode,
  canEditCategories,
  onSearchQueryChange,
  onCategoryKeysChange,
  onEditCategories,
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
    <div className="sticky top-0 z-30 mt-10 -mx-10 max-w-none border-b border-[var(--rule)] bg-[var(--bg)] px-10 py-4 max-md:-mx-6 max-md:px-6">
      <div className="flex flex-wrap items-center gap-4">
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

        <CategoryFilterDropdown
          allCategories={allCategories}
          selectedCategoryKeys={selectedCategoryKeys}
          onChange={onCategoryKeysChange}
          activeClass={activeChipClass}
          inactiveClass={inactiveChipClass}
        />

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          {editMode ? (
            <>
              {canEditCategories ? (
                <button
                  type="button"
                  onClick={onEditCategories}
                  disabled={isSaving}
                  className="inline-flex items-center rounded border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-50"
                >
                  {t("editCategories")}
                </button>
              ) : null}

              <button
                type="button"
                onClick={onAddCategory}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-50"
              >
                <FolderPlus size={14} strokeWidth={1.5} />
                {t("newCategory")}
              </button>

              <button
                type="button"
                onClick={onStartOverClick}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--bad)] transition-colors hover:bg-[color-mix(in_oklab,var(--bad)_8%,transparent)] disabled:pointer-events-none disabled:opacity-50"
              >
                <RotateCcw size={14} strokeWidth={1.5} />
                {t("startOver")}
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={onToggleEditMode}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-50"
          >
            {editMode ? (
              <Eye size={14} strokeWidth={1.5} />
            ) : (
              <Pencil size={14} strokeWidth={1.5} />
            )}
            {editMode ? t("editToggle.done") : t("editToggle.edit")}
          </button>
        </div>
      </div>
    </div>
  );
}
