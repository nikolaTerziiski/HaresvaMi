"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

import type { MenuImportResult } from "@/lib/menu/import-types";

type ImportSummaryBannerProps = {
  result: MenuImportResult;
  existingItemsCount: number;
};

export function ImportSummaryBanner({
  result,
  existingItemsCount,
}: ImportSummaryBannerProps) {
  const t = useTranslations("dashboard.menu.import.review");

  const { total_files, items_extracted, items_flagged } = result.stats;
  const categoryCount = new Set(result.items.map((i) => i.category)).size;

  return (
    <div className="flex flex-col gap-3">
      {/* Green summary banner */}
      <div
        className="flex flex-wrap items-center gap-4 rounded-xl border px-5 py-4"
        style={{
          background: "color-mix(in oklab, var(--good) 8%, var(--paper))",
          borderColor: "color-mix(in oklab, var(--good) 25%, var(--rule))",
        }}
      >
        {/* Check circle */}
        <span
          className="grid size-9 shrink-0 place-items-center rounded-full"
          style={{ backgroundColor: "var(--good)", color: "var(--paper)" }}
        >
          <Check size={17} strokeWidth={2.5} />
        </span>

        {/* Left text */}
        <div className="flex-1">
          <b className="block font-[var(--f-ui)] text-[15px] font-medium text-[var(--ink)]">
            {t("summary.title")}
          </b>
          <span className="font-[var(--f-ui)] text-[13px] text-[var(--ink-2)]">
            {t("summary.body", { count: total_files })}
          </span>
        </div>

        {/* Stats */}
        <div className="flex gap-5">
          <div className="text-center font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            <b
              className="mb-1 block font-[var(--f-display)] text-[24px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]"
              style={{ fontStyle: "normal" }}
            >
              {items_extracted}
            </b>
            {t("summary.stats.items")}
          </div>
          <div className="text-center font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            <b
              className="mb-1 block font-[var(--f-display)] text-[24px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]"
              style={{ fontStyle: "normal" }}
            >
              {categoryCount}
            </b>
            {t("summary.stats.categories")}
          </div>
          <div className="text-center font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            <b
              className="mb-1 block font-[var(--f-display)] text-[24px] font-normal leading-none tracking-[-0.01em]"
              style={{ color: "var(--warn)", fontStyle: "normal" }}
            >
              {items_flagged}
            </b>
            {t("summary.stats.flagged")}
          </div>
        </div>
      </div>

      {/* Existing menu notice */}
      {existingItemsCount > 0 ? (
        <div
          className="rounded-lg border px-4 py-2.5 font-[var(--f-ui)] text-[13px]"
          style={{
            background: "color-mix(in oklab, var(--accent-2) 8%, var(--paper))",
            borderColor:
              "color-mix(in oklab, var(--accent-2) 25%, var(--rule))",
            color: "var(--ink-2)",
          }}
        >
          {t("existingMenuNotice", { count: existingItemsCount })}
        </div>
      ) : null}
    </div>
  );
}
