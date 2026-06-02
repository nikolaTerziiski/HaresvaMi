"use client";

import { useTranslations } from "next-intl";
import { Check, ChevronDown, Minus } from "lucide-react";

import {
  Menu,
  MenuCheckboxItem,
  MenuContent,
  MenuItem,
  MenuTrigger,
} from "@/components/ui/menu";
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

  const allKeys = allCategories.map((c) => c.key);
  const effectiveSelected: string[] =
    selectedCategoryKeys === null ? allKeys : selectedCategoryKeys;
  const allSelected =
    allKeys.length > 0 && effectiveSelected.length === allKeys.length;
  const noneSelected = effectiveSelected.length === 0;
  const partial = !allSelected && !noneSelected;

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
    <Menu modal={false}>
      <MenuTrigger
        render={
          <button
            type="button"
            className={isActive ? activeClass : inactiveClass}
          />
        }
      >
        {triggerLabel}
        <ChevronDown size={14} />
      </MenuTrigger>
      <MenuContent align="start" className="min-w-[260px] max-w-[320px]">
        {/* Master "All" row — tri-state, stays open */}
        <MenuItem closeOnClick={false} onClick={handleMasterToggle}>
          <span className="grid size-4 shrink-0 place-items-center rounded-[4px] border border-[var(--rule)] bg-[var(--paper)]">
            {allSelected ? (
              <Check className="size-3 text-[var(--ink)]" strokeWidth={3} />
            ) : partial ? (
              <Minus className="size-3 text-[var(--ink)]" strokeWidth={3} />
            ) : null}
          </span>
          <span className="flex-1">{t("chipAll")}</span>
        </MenuItem>
        {allCategories.map((cat) => (
          <MenuCheckboxItem
            key={cat.key || "__uncategorized"}
            checked={effectiveSelected.includes(cat.key)}
            onCheckedChange={() => handleCategoryToggle(cat.key)}
            closeOnClick={false}
          >
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
          </MenuCheckboxItem>
        ))}
      </MenuContent>
    </Menu>
  );
}
