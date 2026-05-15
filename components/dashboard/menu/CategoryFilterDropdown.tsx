"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown } from "lucide-react";

import type { CategoryFilter } from "@/lib/menu/types";

type Props = {
  allCategories: CategoryFilter[];
  selectedCategoryKeys: string[] | null;
  onChange: (keys: string[] | null) => void;
  activeClass: string;
  inactiveClass: string;
};

export function CategoryFilterDropdown({
  allCategories,
  selectedCategoryKeys,
  onChange,
  activeClass,
  inactiveClass,
}: Props) {
  const t = useTranslations("dashboard.menu");
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const masterRef = useRef<HTMLInputElement>(null);

  const allKeys = allCategories.map((c) => c.key);
  const effectiveSelected: string[] =
    selectedCategoryKeys === null ? allKeys : selectedCategoryKeys;
  const allSelected =
    allKeys.length > 0 && effectiveSelected.length === allKeys.length;
  const noneSelected = effectiveSelected.length === 0;
  const partial = !allSelected && !noneSelected;

  useEffect(() => {
    if (masterRef.current) {
      masterRef.current.indeterminate = partial;
    }
  }, [partial]);

  function handleBlur(e: React.FocusEvent) {
    if (
      menuRef.current &&
      !menuRef.current.contains(e.relatedTarget as Node) &&
      triggerRef.current !== e.relatedTarget
    ) {
      setOpen(false);
    }
  }

  function handleMasterToggle() {
    if (allSelected) {
      // deselect all → show nothing
      onChange([]);
    } else {
      // select all → null means "no filter"
      onChange(null);
    }
  }

  function handleCategoryToggle(key: string) {
    const current =
      selectedCategoryKeys === null ? allKeys : selectedCategoryKeys;
    if (current.includes(key)) {
      const next = current.filter((k) => k !== key);
      // If all categories are now selected after removal, keep as array
      onChange(next);
    } else {
      const next = [...current, key];
      // If all are now selected, normalise to null
      if (next.length === allKeys.length) {
        onChange(null);
      } else {
        onChange(next);
      }
    }
  }

  // Trigger label
  let triggerLabel: React.ReactNode;
  if (selectedCategoryKeys === null || allSelected) {
    triggerLabel = t("chipAll");
  } else if (effectiveSelected.length === 0) {
    triggerLabel = t("chipAll");
  } else if (effectiveSelected.length === 1) {
    const cat = allCategories.find((c) => c.key === effectiveSelected[0]);
    triggerLabel = (
      <>
        {cat && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: cat.color }}
            aria-hidden
          />
        )}
        {cat ? cat.displayName || t("uncategorized") : effectiveSelected[0]}
      </>
    );
  } else {
    const first = allCategories.find((c) => c.key === effectiveSelected[0]);
    const firstName = first
      ? first.displayName || t("uncategorized")
      : effectiveSelected[0];
    const rest = effectiveSelected.length - 1;
    triggerLabel = (
      <>
        {first && (
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: first.color }}
            aria-hidden
          />
        )}
        {t("categoryFilterMore", { name: firstName, count: rest })}
      </>
    );
  }

  const isActive =
    selectedCategoryKeys !== null &&
    !(selectedCategoryKeys.length === allKeys.length);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onBlur={handleBlur}
        className={isActive ? activeClass : inactiveClass}
      >
        {triggerLabel}
        <ChevronDown size={14} />
      </button>

      {open ? (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t("categoryFilterMenuLabel")}
          tabIndex={-1}
          onBlur={handleBlur}
          className="absolute left-0 top-9 z-50 min-w-[260px] max-w-[320px] max-h-[360px] overflow-y-auto rounded-lg border border-[var(--rule)] bg-[var(--paper)] py-1 shadow-[0_8px_24px_-4px_rgba(26,21,18,0.15)]"
        >
          {/* Master "Всички" row */}
          <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg)] font-[var(--f-ui)] text-[13px] text-[var(--ink)]">
            <input
              ref={masterRef}
              type="checkbox"
              className="size-4 cursor-pointer accent-[var(--ink)]"
              checked={allSelected}
              onChange={handleMasterToggle}
              onMouseDown={(e) => e.preventDefault()}
            />
            <span className="flex-1">{t("chipAll")}</span>
          </label>

          {/* Per-category rows */}
          {allCategories.map((cat) => {
            const checked = effectiveSelected.includes(cat.key);
            return (
              <label
                key={cat.key || "__uncategorized"}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-[var(--bg)] font-[var(--f-ui)] text-[13px] text-[var(--ink)]"
              >
                <input
                  type="checkbox"
                  className="size-4 cursor-pointer accent-[var(--ink)]"
                  checked={checked}
                  onChange={() => handleCategoryToggle(cat.key)}
                  onMouseDown={(e) => e.preventDefault()}
                />
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden
                />
                <span className="flex-1 truncate">
                  {cat.displayName || t("uncategorized")}
                </span>
                <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                  {cat.count}
                </span>
              </label>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
