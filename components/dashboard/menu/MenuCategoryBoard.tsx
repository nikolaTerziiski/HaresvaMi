"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { MenuNoItemsState } from "@/components/dashboard/menu/MenuNoItemsState";
import { isBlankNewRow } from "@/lib/menu/format";
import type { CategoryGroup, ValidationResult } from "@/lib/menu/types";

type MenuCategoryBoardProps = {
  groupedItems: CategoryGroup[];
  isFiltering: boolean;
  validation: ValidationResult;
  readOnly: boolean;
  onOpenCategory: (key: string) => void;
  onAddItem: () => void;
};

function countProblems(group: CategoryGroup, validation: ValidationResult) {
  return group.items.filter((item) => validation.rowErrors[item.id]).length;
}

function previewItems(group: CategoryGroup, readOnly: boolean) {
  const items = readOnly
    ? group.items.filter((item) => !isBlankNewRow(item))
    : group.items;

  return items.slice(0, 3);
}

export function MenuCategoryBoard({
  groupedItems,
  isFiltering,
  validation,
  readOnly,
  onOpenCategory,
  onAddItem,
}: MenuCategoryBoardProps) {
  const t = useTranslations("dashboard.menu");

  if (groupedItems.length === 0) {
    return (
      <div className="mt-8">
        <MenuNoItemsState isFiltering={isFiltering} onAddItem={onAddItem} />
      </div>
    );
  }

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
      {groupedItems.map((group) => {
        const groupLabel = group.displayName || t("uncategorized");
        const visibleItems = previewItems(group, readOnly);
        const hiddenCount = Math.max(
          group.items.length - visibleItems.length,
          0,
        );
        const problemCount = countProblems(group, validation);

        return (
          <button
            key={group.key || "__uncategorized"}
            type="button"
            onClick={() => onOpenCategory(group.key)}
            className="group flex min-h-[230px] flex-col rounded-lg border border-[var(--rule)] p-5 text-left transition-colors hover:border-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            style={{
              backgroundColor: `color-mix(in srgb, ${group.color} 9%, var(--paper))`,
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: group.color }}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <h2 className="font-[var(--f-display)] text-[30px] font-normal leading-[1.05] text-[var(--ink)]">
                  {groupLabel}
                </h2>
                <p className="mt-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
                  {t("itemCountPlural", { count: group.items.length })}
                </p>
              </div>

              {problemCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 rounded border border-[color-mix(in_oklab,var(--bad)_28%,var(--rule))] bg-[color-mix(in_oklab,var(--bad)_8%,var(--paper))] px-2.5 py-1 font-[var(--f-ui)] text-[12px] text-[var(--bad)]">
                  <AlertTriangle size={13} strokeWidth={1.5} />
                  {t("categoryBoard.problems", { count: problemCount })}
                </span>
              ) : null}
            </div>

            <div className="mt-6 grid gap-2">
              {visibleItems.length > 0 ? (
                visibleItems.map((item) => {
                  const hasError = Boolean(validation.rowErrors[item.id]);
                  const priceText = item.price.trim()
                    ? `${item.price.trim()} лв`
                    : "—";

                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 border-t border-[color-mix(in_oklab,var(--rule)_80%,transparent)] pt-2 text-[14px]"
                    >
                      <span
                        className={[
                          "size-1.5 shrink-0 rounded-full",
                          hasError ? "bg-[var(--bad)]" : "bg-[var(--rule)]",
                        ].join(" ")}
                      />
                      <span className="min-w-0 flex-1 truncate text-[var(--ink)]">
                        {item.name_bg.trim() || t("itemUntitled")}
                      </span>
                      <span className="shrink-0 font-[var(--f-mono)] text-[12px] text-[var(--ink-mute)]">
                        {priceText}
                      </span>
                    </div>
                  );
                })
              ) : (
                <p className="border-t border-[color-mix(in_oklab,var(--rule)_80%,transparent)] pt-3 text-[14px] text-[var(--ink-mute)]">
                  {t("categoryBoard.emptyPreview")}
                </p>
              )}

              {hiddenCount > 0 ? (
                <p className="text-[13px] text-[var(--ink-mute)]">
                  {t("categoryBoard.moreItems", { count: hiddenCount })}
                </p>
              ) : null}
            </div>

            <span className="mt-auto inline-flex items-center gap-2 pt-6 font-[var(--f-ui)] text-[13px] font-medium text-[var(--accent)] transition-colors group-hover:text-[var(--ink)]">
              {t("categoryBoard.open")}
              <ArrowRight size={15} strokeWidth={1.5} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
