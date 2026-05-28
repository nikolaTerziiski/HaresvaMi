"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, ArrowRightLeft, Check, FileText } from "lucide-react";

import { AI_IMPORT_FOOD_CATEGORIES } from "@/lib/menu/constants";
import type {
  ImportItemConfidence,
  MenuImportItem,
} from "@/lib/menu/import-types";

export type ItemWithId = MenuImportItem & { client_id: string };

// ---------------------------------------------------------------------------
// Confidence dot
// ---------------------------------------------------------------------------

export function ConfidenceDot({ level }: { level: ImportItemConfidence }) {
  if (level === "high") {
    return (
      <span
        className="grid size-3.5 shrink-0 place-items-center rounded-full"
        style={{ background: "var(--good)", color: "var(--paper)" }}
        aria-label="high confidence"
      >
        <Check size={9} strokeWidth={3} />
      </span>
    );
  }
  if (level === "medium") {
    return (
      <span
        className="grid size-3.5 shrink-0 place-items-center rounded-full font-[var(--f-mono)] text-[10px] font-bold"
        style={{ background: "var(--warn)", color: "var(--paper)" }}
        aria-label="medium confidence"
      >
        ?
      </span>
    );
  }
  return (
    <span
      className="grid size-3.5 shrink-0 place-items-center rounded-full border font-[var(--f-mono)] text-[10px] font-bold"
      style={{
        borderWidth: "1.5px",
        borderColor: "var(--accent)",
        background: "transparent",
        color: "var(--accent)",
      }}
      aria-label="low confidence"
    >
      !
    </span>
  );
}

// ---------------------------------------------------------------------------
// Dish row
// ---------------------------------------------------------------------------

type DishRowProps = {
  item: ItemWithId;
  currentCategory: string;
  onNameChange: (id: string, value: string) => void;
  onPriceChange: (id: string, value: string) => void;
  onCategoryChange: (id: string, category: string) => void;
};

export function DishRow({
  item,
  currentCategory,
  onNameChange,
  onPriceChange,
  onCategoryChange,
}: DishRowProps) {
  const t = useTranslations("dashboard.menu.import.review");
  const [localName, setLocalName] = useState(item.name_bg);
  const [localPrice, setLocalPrice] = useState(
    item.price !== null ? String(item.price) : "",
  );
  const [moveOpen, setMoveOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const moveButtonRef = useRef<HTMLButtonElement>(null);

  const hasWarn = Boolean(item.warn);

  function handleFix() {
    if (item.confidence === "medium") {
      priceRef.current?.focus();
    } else {
      nameRef.current?.focus();
    }
  }

  function handleMoveBlur(e: React.FocusEvent) {
    if (
      popoverRef.current &&
      !popoverRef.current.contains(e.relatedTarget as Node) &&
      moveButtonRef.current !== e.relatedTarget
    ) {
      setMoveOpen(false);
    }
  }

  function handleSelectCategory(cat: string) {
    onCategoryChange(item.client_id, cat);
    setMoveOpen(false);
  }

  const availableCategories = AI_IMPORT_FOOD_CATEGORIES.filter(
    (cat) => cat !== currentCategory,
  );

  return (
    <li
      className="group relative"
      style={hasWarn ? { boxShadow: "inset 3px 0 0 var(--warn)" } : undefined}
    >
      <div
        className="grid items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--paper)] sm:px-5"
        style={{ gridTemplateColumns: "22px 1fr 120px 32px" }}
      >
        <ConfidenceDot level={item.confidence} />

        <input
          ref={nameRef}
          type="text"
          value={localName}
          onChange={(e) => {
            setLocalName(e.target.value);
            onNameChange(item.client_id, e.target.value);
          }}
          className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 font-[var(--f-ui)] text-[14.5px] font-medium text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)] focus:bg-[var(--paper)]"
        />

        <div className="flex items-center justify-end gap-1">
          <input
            ref={priceRef}
            type="text"
            inputMode="decimal"
            value={localPrice}
            onChange={(e) => {
              setLocalPrice(e.target.value);
              onPriceChange(item.client_id, e.target.value);
            }}
            placeholder="—"
            className="w-full rounded border border-transparent bg-transparent py-1.5 pr-1 text-right font-[var(--f-mono)] text-[13.5px] font-medium tabular-nums text-[var(--ink)] outline-none transition-colors focus:border-[var(--accent)] focus:bg-[var(--paper)]"
          />
          <span className="shrink-0 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
            лв
          </span>
        </div>

        <div className="relative">
          <button
            ref={moveButtonRef}
            type="button"
            onClick={() => setMoveOpen((o) => !o)}
            onBlur={handleMoveBlur}
            title={t("moveTo")}
            aria-label={t("moveTo")}
            className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-100 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)] md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
          >
            <ArrowRightLeft size={16} strokeWidth={1.5} />
          </button>

          {moveOpen ? (
            <div
              ref={popoverRef}
              onBlur={handleMoveBlur}
              tabIndex={-1}
              className="absolute right-0 top-9 z-50 min-w-[180px] rounded-lg border border-[var(--rule)] bg-[var(--paper)] py-1 shadow-[0_8px_24px_-4px_rgba(26,21,18,0.15)]"
            >
              <p className="px-3 py-1.5 font-[var(--f-ui)] text-[11px] uppercase tracking-[0.12em] text-[var(--ink-mute)]">
                {t("moveTo")}
              </p>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectCategory(cat);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-[var(--f-ui)] text-[13px] text-[var(--ink)] hover:bg-[var(--bg)]"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: getCategoryColor(cat) }}
                    aria-hidden
                  />
                  {cat}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {hasWarn ? (
        <div
          className="flex flex-wrap items-center gap-2.5 px-4 pb-3 pt-0 font-[var(--f-mono)] text-[10.5px] tracking-[0.04em] sm:px-5"
          style={{ color: "var(--warn)" }}
        >
          <AlertTriangle
            size={12}
            strokeWidth={1.75}
            style={{ flexShrink: 0 }}
          />
          <span>{item.warn}</span>
          <button
            type="button"
            onClick={handleFix}
            className="rounded px-2 py-0.5 text-[10.5px] uppercase tracking-[0.06em] text-[var(--paper)] transition-colors hover:opacity-80"
            style={{ background: "var(--warn)" }}
          >
            {t("warn.fixChip")}
          </button>
          {item.source_file_name ? (
            <span className="ml-auto inline-flex items-center gap-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
              <FileText size={11} strokeWidth={1.5} />
              {item.source_file_name}
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

// ---------------------------------------------------------------------------
// Category color palette
// ---------------------------------------------------------------------------

const CATEGORY_PALETTE: Record<string, string> = {
  Салати: "#C77A28",
  Супи: "#8B6235",
  "Основни ястия": "#B23E1F",
  Основни: "#B23E1F",
  Десерти: "#9B4A3F",
  Безалкохолни: "#7C5A6E",
  Алкохол: "#5B3F2B",
  Гарнитури: "#C77A28",
  Предястия: "#8B6235",
  Скара: "#D17A2A",
  Некласифицирано: "#8A7A68",
};

export function getCategoryColor(name: string): string {
  return CATEGORY_PALETTE[name] ?? "var(--ink-mute)";
}

// ---------------------------------------------------------------------------
// Category accordion
// ---------------------------------------------------------------------------

type CategoryAccordionProps = {
  category: string;
  items: ItemWithId[];
  color: string;
  expanded: boolean;
  onToggle: () => void;
  onNameChange: (id: string, value: string) => void;
  onPriceChange: (id: string, value: string) => void;
  onCategoryChange: (id: string, category: string) => void;
};

export function CategoryAccordion({
  category,
  items,
  color,
  expanded,
  onToggle,
  onNameChange,
  onPriceChange,
  onCategoryChange,
}: CategoryAccordionProps) {
  const warnCount = items.filter((i) => Boolean(i.warn)).length;

  return (
    <article
      className="overflow-hidden rounded-xl"
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 20%, var(--bg-2))`,
      }}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left"
      >
        <span
          className="shrink-0 text-[var(--ink-mute)] transition-transform duration-200"
          style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)" }}
        >
          <svg
            viewBox="0 0 24 24"
            width={12}
            height={12}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>

        <span
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />

        <h3 className="flex-1 font-[var(--f-display)] text-[26px] font-normal leading-none tracking-[-0.01em] text-[var(--ink)]">
          {category}
        </h3>

        <div className="flex items-center gap-3 font-[var(--f-mono)] text-[10.5px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          <span>{items.length} ястия</span>
          {warnCount > 0 ? (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: "color-mix(in oklab, var(--warn) 15%, transparent)",
                color: "var(--warn)",
              }}
            >
              <span
                className="size-1.5 rounded-full"
                style={{ background: "var(--warn)" }}
              />
              {warnCount} за проверка
            </span>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <ul
          className="divide-y divide-[var(--rule)] border-t border-[var(--rule)]"
          style={{
            background: "color-mix(in oklab, var(--paper) 75%, transparent)",
          }}
        >
          {items.map((item) => (
            <DishRow
              key={item.client_id}
              item={item}
              currentCategory={category}
              onNameChange={onNameChange}
              onPriceChange={onPriceChange}
              onCategoryChange={onCategoryChange}
            />
          ))}
        </ul>
      ) : null}
    </article>
  );
}
