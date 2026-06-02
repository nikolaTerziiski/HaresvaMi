"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import type { CategoryFilter } from "@/lib/menu/types";

type MenuCategoryRailProps = {
  categories: CategoryFilter[];
  totalItems: number;
  activeCategoryKey: string | null;
  onSelectCategory: (key: string) => void;
  onAddCategory: () => void;
};

export function MenuCategoryRail({
  categories,
  totalItems,
  activeCategoryKey,
  onSelectCategory,
  onAddCategory,
}: MenuCategoryRailProps) {
  const t = useTranslations("dashboard.menu");
  const [addingNew, setAddingNew] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // The rail always shows all categories (no search filter applied to the rail itself).
  // The active key gets the paper+ring treatment from the mockup .cat-link.on.

  return (
    <aside
      className={[
        // Desktop: fixed-width left pane, full-height with own scroll
        "flex flex-col border-[var(--rule)] bg-[var(--bg)]",
        "md:w-[264px] md:shrink-0 md:border-r md:overflow-y-auto",
        // Mobile: border-bottom, horizontal chip row
        "max-md:border-b max-md:w-full",
      ].join(" ")}
    >
      <div className="p-7 max-md:px-4 max-md:py-4">
        {/* Rail header */}
        <div className="mb-4 flex items-baseline gap-2 px-1">
          <h3 className="font-[var(--f-display)] text-[22px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]">
            {t("rail.title")}
          </h3>
          <span className="ml-auto font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            {t("rail.totalCount", { count: totalItems })}
          </span>
        </div>

        {/* Category list */}
        <div
          className={[
            "flex gap-0.5",
            "md:flex-col",
            // Mobile: horizontal wrap
            "max-md:flex-row max-md:flex-wrap",
          ].join(" ")}
        >
          {categories.map((cat) => {
            const isActive = cat.key === activeCategoryKey;
            return (
              <button
                key={cat.key || "__uncategorized"}
                type="button"
                onClick={() => onSelectCategory(cat.key)}
                className={[
                  "flex items-center gap-[11px] rounded-[9px] px-3 py-2.5 text-left transition-colors",
                  "max-md:flex-none",
                  isActive
                    ? "bg-[var(--paper)] shadow-[inset_0_0_0_1px_var(--rule)]"
                    : "hover:bg-[color-mix(in_oklab,var(--paper)_60%,transparent)]",
                ].join(" ")}
              >
                {/* Color dot */}
                <span
                  className="size-[9px] shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden
                />
                {/* Category name */}
                <span
                  className={[
                    "flex-1 text-[14px]",
                    isActive
                      ? "font-medium text-[var(--ink)]"
                      : "text-[var(--ink-2)]",
                  ].join(" ")}
                >
                  {cat.displayName || t("uncategorized")}
                </span>
                {/* Item count */}
                <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* "Нова категория" dashed button */}
        {addingNew ? (
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder={t("newCategory")}
            className="mt-3.5 w-full rounded-[9px] border border-[var(--accent)] bg-[var(--paper)] px-3 py-2.5 font-[var(--f-ui)] text-[13px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
            onBlur={() => {
              setAddingNew(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setAddingNew(false);
              } else if (e.key === "Enter") {
                setAddingNew(false);
                onAddCategory();
              }
            }}
          />
        ) : (
          <button
            type="button"
            onClick={onAddCategory}
            className={[
              "mt-3.5 flex w-full items-center justify-center gap-2 rounded-[9px] border border-dashed border-[var(--rule)]",
              "px-3 py-2.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--ink-mute)]",
              "transition-colors hover:border-[var(--ink-mute)] hover:text-[var(--ink)]",
            ].join(" ")}
          >
            <Plus size={13} strokeWidth={1.75} />
            {t("rail.addCategory")}
          </button>
        )}
      </div>
    </aside>
  );
}
