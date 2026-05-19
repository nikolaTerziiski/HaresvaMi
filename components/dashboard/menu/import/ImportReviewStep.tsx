"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { ImportCommitBar } from "@/components/dashboard/menu/import/ImportCommitBar";
import {
  CategoryAccordion,
  getCategoryColor,
  type ItemWithId,
} from "@/components/dashboard/menu/import/ImportCategoryAccordion";
import { ImportReviewToolbar } from "@/components/dashboard/menu/import/ImportReviewToolbar";
import { ImportSummaryBanner } from "@/components/dashboard/menu/import/ImportSummaryBanner";
import type {
  ImportItemConfidence,
  MenuImportItem,
  MenuImportResult,
} from "@/lib/menu/import-types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ImportReviewStepProps = {
  result: MenuImportResult;
  existingItemsCount: number;
  onDiscard: () => void;
  onCommit: (items: MenuImportItem[]) => void;
  saving: boolean;
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ImportReviewStep({
  result,
  existingItemsCount,
  onDiscard,
  onCommit,
  saving,
}: ImportReviewStepProps) {
  const t = useTranslations("dashboard.menu.import.review");

  // Assign stable client_ids once on mount
  const itemsWithIds = useMemo<ItemWithId[]>(
    () =>
      result.items.map((item) => ({
        ...item,
        client_id: crypto.randomUUID(),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Mutable edited name/price per client_id
  const editsRef = useRef<Record<string, { name_bg?: string; price?: string }>>(
    {},
  );

  function handleNameChange(id: string, value: string) {
    editsRef.current[id] = { ...editsRef.current[id], name_bg: value };
  }

  function handlePriceChange(id: string, value: string) {
    editsRef.current[id] = { ...editsRef.current[id], price: value };
  }

  // Toolbar state
  const [searchQuery, setSearchQuery] = useState("");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);
  const [sortByConfidence, setSortByConfidence] = useState(false);

  // Group items by category — Uncategorized always last
  const categories = useMemo(() => {
    const groups = new Map<string, ItemWithId[]>();
    const uncategorizedKey = "Некласифицирано";

    for (const item of itemsWithIds) {
      const cat = item.category || uncategorizedKey;
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat)!.push(item);
    }

    const ordered: Array<{ name: string; items: ItemWithId[] }> = [];
    let uncategorized: { name: string; items: ItemWithId[] } | null = null;
    for (const [name, items] of groups) {
      if (name === uncategorizedKey) {
        uncategorized = { name, items };
      } else {
        ordered.push({ name, items });
      }
    }
    if (uncategorized) ordered.push(uncategorized);
    return ordered;
  }, [itemsWithIds]);

  // Expanded state per category — all expanded by default
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>(
    () => {
      const m: Record<string, boolean> = {};
      for (const cat of categories) m[cat.name] = true;
      return m;
    },
  );

  const allExpanded = categories.every((c) => expandedMap[c.name] !== false);

  function toggleCategory(name: string) {
    setExpandedMap((prev) => ({ ...prev, [name]: !prev[name] }));
  }

  function toggleExpandAll() {
    const next = !allExpanded;
    setExpandedMap(() => {
      const m: Record<string, boolean> = {};
      for (const cat of categories) m[cat.name] = next;
      return m;
    });
  }

  // Filtering + sorting
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("bg-BG");

    return categories
      .map((cat) => {
        let items = cat.items;

        if (query) {
          items = items.filter((item) =>
            item.name_bg.toLocaleLowerCase("bg-BG").includes(query),
          );
        }

        if (showFlaggedOnly) {
          items = items.filter((item) => item.confidence !== "high");
        }

        if (sortByConfidence) {
          const ORDER: Record<ImportItemConfidence, number> = {
            low: 0,
            medium: 1,
            high: 2,
          };
          items = [...items].sort(
            (a, b) => ORDER[a.confidence] - ORDER[b.confidence],
          );
        }

        return { ...cat, items };
      })
      .filter((cat) => cat.items.length > 0);
  }, [categories, searchQuery, showFlaggedOnly, sortByConfidence]);

  const flaggedCount = itemsWithIds.filter(
    (i) => i.confidence !== "high",
  ).length;
  const warnCount = itemsWithIds.filter((i) => Boolean(i.warn)).length;
  const categoryCount = categories.length;

  function handleCommit() {
    const finalItems: MenuImportItem[] = itemsWithIds.map((item) => {
      const edits = editsRef.current[item.client_id];
      const rawPrice = edits?.price;
      let price = item.price;
      if (rawPrice !== undefined) {
        const parsed = parseFloat(rawPrice.replace(",", "."));
        price = isNaN(parsed) || parsed < 0 ? null : parsed;
      }
      return {
        name_bg: edits?.name_bg ?? item.name_bg,
        category: item.category,
        price,
        description_bg: item.description_bg,
        confidence: item.confidence,
        source_file_name: item.source_file_name,
        duplicate_of_item_id: item.duplicate_of_item_id,
        warn: item.warn,
      };
    });

    onCommit(finalItems);
  }

  return (
    <div className="mt-8">
      {/* Intro */}
      <section className="mb-6">
        <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h2 className="mt-2 font-[var(--f-display)] text-[40px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[30px]">
          {t.rich("title", {
            em: (chunks) => (
              <em className="italic text-[var(--accent)]">{chunks}</em>
            ),
          })}
        </h2>
        <p className="mt-3 max-w-[620px] font-[var(--f-ui)] text-[15.5px] leading-[1.55] text-[var(--ink-mute)]">
          {t("subtitle", {
            count: itemsWithIds.length,
            categories: categoryCount,
          })}
        </p>
      </section>

      {/* Summary banner + existing notice */}
      <ImportSummaryBanner
        result={result}
        existingItemsCount={existingItemsCount}
      />

      {/* Toolbar */}
      <ImportReviewToolbar
        total={itemsWithIds.length}
        flaggedCount={flaggedCount}
        searchQuery={searchQuery}
        showFlaggedOnly={showFlaggedOnly}
        sortByConfidence={sortByConfidence}
        allExpanded={allExpanded}
        onSearchChange={setSearchQuery}
        onToggleFlagged={() => setShowFlaggedOnly((v) => !v)}
        onToggleSort={() => setSortByConfidence((v) => !v)}
        onToggleExpandAll={toggleExpandAll}
      />

      {/* Category accordions */}
      <div className="mt-5 flex flex-col gap-3">
        {filteredCategories.length === 0 ? (
          <p className="py-10 text-center font-[var(--f-mono)] text-[13px] text-[var(--ink-mute)]">
            Няма съвпадения за текущия филтър.
          </p>
        ) : (
          filteredCategories.map((cat) => (
            <CategoryAccordion
              key={cat.name}
              category={cat.name}
              items={cat.items}
              color={getCategoryColor(cat.name)}
              expanded={expandedMap[cat.name] ?? true}
              onToggle={() => toggleCategory(cat.name)}
              onNameChange={handleNameChange}
              onPriceChange={handlePriceChange}
            />
          ))
        )}
      </div>

      {/* Floating commit bar */}
      <ImportCommitBar
        itemCount={itemsWithIds.length}
        warnCount={warnCount}
        saving={saving}
        onDiscard={onDiscard}
        onCommit={handleCommit}
      />
    </div>
  );
}
