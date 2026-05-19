"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

import type { InsightDishStats } from "@/lib/insights/types";

type SortKey = "name" | "rating" | "samples" | "delta";
type SortDir = "asc" | "desc";

type DishRankingTableProps = {
  rows: InsightDishStats[];
  minSample: number;
};

function formatRating(value: number) {
  return value.toFixed(1).replace(".", ",");
}

function sortRows(
  rows: InsightDishStats[],
  key: SortKey,
  dir: SortDir,
): InsightDishStats[] {
  const sign = dir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (key === "name") {
      return sign * a.name.localeCompare(b.name, "bg-BG");
    }
    if (key === "rating") {
      const aVal = a.currentAverage ?? -Infinity;
      const bVal = b.currentAverage ?? -Infinity;
      return sign * (aVal - bVal);
    }
    if (key === "samples") {
      return sign * (a.currentCount - b.currentCount);
    }
    if (key === "delta") {
      const aVal = a.delta ?? -Infinity;
      const bVal = b.delta ?? -Infinity;
      return sign * (aVal - bVal);
    }
    return 0;
  });
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  const color = active ? "text-[var(--ink)]" : "text-[var(--ink-mute)]";
  const Icon = dir === "asc" ? ArrowUp : ArrowDown;
  return <Icon className={`inline-block h-3 w-3 ${color}`} />;
}

function DeltaCell({ delta }: { delta: number | null }) {
  const t = useTranslations("dashboard.insights.ranking");

  if (delta === null || delta === 0) {
    return (
      <span className="font-[var(--f-mono)] text-[12px] text-[var(--ink-mute)]">
        {t("noDelta")}
      </span>
    );
  }

  const color = delta > 0 ? "text-[var(--good)]" : "text-[var(--bad)]";
  const sign = delta > 0 ? "+" : "";
  const Icon = delta > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-0.5 font-[var(--f-mono)] text-[12px] ${color}`}
    >
      <Icon className="h-3 w-3" />
      {sign}
      {formatRating(delta)}
    </span>
  );
}

export function DishRankingTable({ rows, minSample }: DishRankingTableProps) {
  const t = useTranslations("dashboard.insights.ranking");
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showHidden, setShowHidden] = useState(false);

  if (rows.length === 0) return null;

  const visibleRows = rows.filter((r) => r.currentCount >= minSample);
  const hiddenRows = rows.filter((r) => r.currentCount < minSample);
  const hiddenN = hiddenRows.length;

  const activeRows = showHidden ? rows : visibleRows;
  const sorted = sortRows(activeRows, sortKey, sortDir);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" ? "asc" : "desc");
    }
  }

  function headerClass(key: SortKey, align: "left" | "right" = "left") {
    const base =
      "cursor-pointer select-none py-2 font-[var(--f-ui)] text-[11px] uppercase tracking-[0.08em]";
    const activeColor =
      sortKey === key ? "text-[var(--ink)]" : "text-[var(--ink-mute)]";
    const alignClass = align === "right" ? "text-right" : "text-left";
    return `${base} ${activeColor} ${alignClass}`;
  }

  const hasCategory = rows.some((r) => r.category !== null);

  return (
    <div>
      <p className="mb-1 mt-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
        {t("eyebrow")}
      </p>
      <h2 className="m-0 font-[var(--f-display)] text-2xl font-normal text-[var(--ink)]">
        {t("title")}
      </h2>
      {hiddenN > 0 && (
        <p className="mb-0 mt-2 text-[13px] leading-[1.5] text-[var(--ink-mute)]">
          {t("subtitle", { count: hiddenN, minSample })}
        </p>
      )}

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th
                className={headerClass("name")}
                onClick={() => handleSort("name")}
              >
                {t("columns.name")}
                <span className="ml-1">
                  <SortIndicator active={sortKey === "name"} dir={sortDir} />
                </span>
              </th>
              {hasCategory && (
                <th className="py-2 text-left font-[var(--f-ui)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                  {t("columns.category")}
                </th>
              )}
              <th
                className={headerClass("rating", "right")}
                onClick={() => handleSort("rating")}
              >
                {t("columns.rating")}
                <span className="ml-1">
                  <SortIndicator active={sortKey === "rating"} dir={sortDir} />
                </span>
              </th>
              <th
                className={headerClass("samples", "right")}
                onClick={() => handleSort("samples")}
              >
                {t("columns.samples")}
                <span className="ml-1">
                  <SortIndicator active={sortKey === "samples"} dir={sortDir} />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, index) => {
              const isLast = index === sorted.length - 1;
              return (
                <tr
                  key={row.menuItemId}
                  className={`hover:bg-[var(--bg-2)] ${isLast ? "" : "border-b border-[var(--rule)]"}`}
                >
                  <td className="py-3 pr-4 font-[var(--f-ui)] text-[14px] text-[var(--ink)]">
                    {row.name}
                  </td>
                  {hasCategory && (
                    <td className="py-3 pr-4">
                      {row.category ? (
                        <span className="inline-block rounded px-2 py-0.5 font-[var(--f-ui)] text-[11px] text-[var(--ink-mute)] ring-1 ring-[var(--rule)]">
                          {row.category}
                        </span>
                      ) : null}
                    </td>
                  )}
                  <td className="py-3 pr-4 text-right">
                    <span className="font-[var(--f-mono)] text-[14px] text-[var(--ink)]">
                      {row.currentAverage !== null
                        ? `${formatRating(row.currentAverage)} / 5`
                        : "—"}
                    </span>
                    <span className="ml-2">
                      <DeltaCell delta={row.delta} />
                    </span>
                  </td>
                  <td className="py-3 text-right font-[var(--f-mono)] text-[14px] text-[var(--ink)]">
                    {row.currentCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hiddenN > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            {showHidden ? t("hideAll") : t("showHidden")}
          </button>
        </div>
      )}
    </div>
  );
}
