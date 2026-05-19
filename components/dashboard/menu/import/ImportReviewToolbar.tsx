"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";

type ImportReviewToolbarProps = {
  total: number;
  flaggedCount: number;
  searchQuery: string;
  showFlaggedOnly: boolean;
  sortByConfidence: boolean;
  allExpanded: boolean;
  onSearchChange: (q: string) => void;
  onToggleFlagged: () => void;
  onToggleSort: () => void;
  onToggleExpandAll: () => void;
};

export function ImportReviewToolbar({
  total,
  flaggedCount,
  searchQuery,
  showFlaggedOnly,
  sortByConfidence,
  allExpanded,
  onSearchChange,
  onToggleFlagged,
  onToggleSort,
  onToggleExpandAll,
}: ImportReviewToolbarProps) {
  const t = useTranslations("dashboard.menu.import.review.toolbar");

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {/* Search */}
      <div
        className="flex flex-[0_1_320px] items-center gap-2.5 rounded-full border px-3.5 py-2"
        style={{
          background: "var(--paper)",
          borderColor: "var(--rule)",
        }}
      >
        <Search
          size={14}
          strokeWidth={1.75}
          style={{ color: "var(--ink-mute)", flexShrink: 0 }}
        />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 bg-transparent font-[var(--f-ui)] text-[13.5px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
        />
      </div>

      {/* All pill */}
      <button
        type="button"
        onClick={() => showFlaggedOnly && onToggleFlagged()}
        className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-[var(--f-ui)] text-[13px] transition-colors"
        style={{
          background: !showFlaggedOnly ? "var(--ink)" : "transparent",
          borderColor: !showFlaggedOnly ? "var(--ink)" : "var(--rule)",
          color: !showFlaggedOnly ? "var(--paper)" : "var(--ink-2)",
        }}
      >
        {t("all")}
        <span
          className="font-[var(--f-mono)] text-[10.5px]"
          style={{ opacity: 0.7 }}
        >
          {total}
        </span>
      </button>

      {/* Flagged-only pill */}
      <button
        type="button"
        onClick={onToggleFlagged}
        className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-[var(--f-ui)] text-[13px] transition-colors"
        style={{
          background: showFlaggedOnly ? "var(--warn)" : "transparent",
          borderColor: showFlaggedOnly ? "var(--warn)" : "var(--rule)",
          color: showFlaggedOnly ? "var(--paper)" : "var(--ink-2)",
        }}
      >
        {!showFlaggedOnly ? (
          <span
            className="size-1.5 shrink-0 rounded-full"
            style={{ background: "var(--warn)" }}
          />
        ) : null}
        {t("flagged")}
        <span
          className="font-[var(--f-mono)] text-[10.5px]"
          style={{ opacity: 0.7 }}
        >
          {flaggedCount}
        </span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sort toggle */}
      <button
        type="button"
        onClick={onToggleSort}
        className="rounded border px-3 py-1.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] transition-colors"
        style={{
          borderColor: sortByConfidence ? "var(--ink-mute)" : "transparent",
          color: sortByConfidence ? "var(--ink)" : "var(--ink-mute)",
        }}
      >
        ↕ {t("sortByConfidence")}
      </button>

      {/* Collapse / expand all */}
      <button
        type="button"
        onClick={onToggleExpandAll}
        className="rounded border border-transparent px-3 py-1.5 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.06em] text-[var(--ink-mute)] transition-colors hover:border-[var(--rule)] hover:text-[var(--ink)]"
      >
        {allExpanded ? t("collapseAll") : t("expandAll")}
      </button>
    </div>
  );
}
