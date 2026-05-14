"use client";

import { Plus, RotateCcw, Search, Trash2 } from "lucide-react";

/**
 * DESIGN PREVIEW — not wired to the real menu flow.
 * Renders the "first-time review after AI upload or manual entry" state.
 */

type Item = {
  id: string;
  name: string;
  description?: string;
  price: string;
};

type Category = {
  key: string;
  name: string;
  color: string;
  items: Item[];
};

const CATEGORIES: Category[] = [
  {
    key: "salati",
    name: "Салати",
    color: "var(--good)",
    items: [
      {
        id: "1",
        name: "Шопска салата",
        description: "пресни домати, краставици, чушки, краве сирене",
        price: "8.90",
      },
      { id: "2", name: "Овчарска", description: "", price: "9.50" },
      {
        id: "3",
        name: "Снежанка",
        description: "извара с краставици и копър",
        price: "7.20",
      },
      { id: "4", name: "Таратор", description: "", price: "6.50" },
    ],
  },
  {
    key: "osnovni",
    name: "Основни",
    color: "var(--plum)",
    items: [
      {
        id: "5",
        name: "Кебапче (×2)",
        description: "свинско-телешко на скара",
        price: "7.80",
      },
      { id: "6", name: "Свинско печено", description: "", price: "14.50" },
      {
        id: "7",
        name: "Мусака",
        description: "класическа с патладжан",
        price: "11.00",
      },
      { id: "8", name: "Пиле на жар", description: "", price: "12.00" },
      { id: "9", name: "Пържола свинска", description: "", price: "13.20" },
    ],
  },
  {
    key: "deserti",
    name: "Десерти",
    color: "var(--accent-2)",
    items: [
      {
        id: "10",
        name: "Тиквеник",
        description: "като на баба",
        price: "5.50",
      },
      { id: "11", name: "Крем карамел", description: "", price: "4.80" },
      { id: "12", name: "Мед с орехи", description: "", price: "4.20" },
    ],
  },
];

const TOTAL_ITEMS = CATEGORIES.reduce((sum, c) => sum + c.items.length, 0);

export function MenuReviewDesign() {
  return (
    <div className="relative w-full pb-28">
      <div className="mx-auto w-full max-w-[1080px] px-10 py-10 max-md:px-6 max-md:py-8">
        {/* Header */}
        <header className="max-w-[680px]">
          <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
            Меню · Преглед
          </p>
          <h1 className="mt-5 font-[var(--f-display)] text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[32px]">
            Прегледай <em className="italic">менюто</em> си.
          </h1>
          <p className="mt-4 max-w-[540px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
            Промени каквото трябва, добави липсващи ястия, опиши тези, които
            искаш да изпъкват. Когато си готов, натисни „Запази".
          </p>
        </header>

        {/* Toolbar */}
        <div className="sticky top-0 z-30 mt-10 -mx-10 border-b border-[var(--rule)] bg-[var(--bg)] px-10 py-4 max-md:-mx-6 max-md:px-6">
          <div className="flex flex-wrap items-center gap-4">
            <label className="relative flex max-w-[320px] flex-1 items-center">
              <Search
                size={16}
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 text-[var(--ink-mute)]"
              />
              <input
                type="text"
                placeholder="Търси ястие..."
                className="min-h-10 w-full rounded border border-[var(--rule)] bg-[var(--paper)] pl-9 pr-3 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none transition-colors placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)]"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]"
              >
                Всички
                <span className="font-[var(--f-mono)] text-[11px] opacity-70">
                  {TOTAL_ITEMS}
                </span>
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: cat.color }}
                    aria-hidden
                  />
                  {cat.name}
                  <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                    {cat.items.length}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="ml-auto inline-flex items-center gap-1.5 rounded px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--ink-2)]"
            >
              <RotateCcw size={14} strokeWidth={1.5} />
              Започни наново
            </button>
          </div>
        </div>

        {/* Category cards */}
        <div className="mt-8 grid gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryCard key={cat.key} category={cat} />
          ))}
        </div>
      </div>

      {/* Sticky unsaved bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)]">
        <div className="mx-auto flex w-full max-w-[1080px] items-center gap-4 px-10 py-3 max-md:px-6">
          <span className="flex items-center gap-2.5 text-[13px] leading-none">
            <span className="relative grid place-items-center">
              <span
                className="absolute size-3 animate-ping rounded-full bg-[var(--accent)] opacity-60"
                aria-hidden
              />
              <span className="relative size-2 rounded-full bg-[var(--accent)]" />
            </span>
            <span>Имаш 8 промени</span>
          </span>

          <span className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--paper)]/50">
            · 12 ястия · 3 категории
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="rounded px-4 py-2 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]/70 transition-colors hover:bg-[var(--paper)]/10 hover:text-[var(--paper)]"
            >
              Отмени
            </button>
            <button
              type="button"
              className="rounded bg-[var(--accent)] px-5 py-2 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--paper)] hover:text-[var(--ink)]"
            >
              Запази 12 ястия
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <article className="rounded-lg border border-[var(--rule)] bg-[var(--paper)]">
      {/* Card header */}
      <header className="flex items-baseline gap-4 border-b border-[var(--rule)] px-6 py-5">
        <span
          className="relative top-[-3px] size-2.5 rounded-full"
          style={{ backgroundColor: category.color }}
          aria-hidden
        />
        <h2 className="font-[var(--f-display)] text-[26px] font-normal leading-none text-[var(--ink)]">
          {category.name}
        </h2>
        <span className="ml-auto font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
          {category.items.length} ястия
        </span>
      </header>

      {/* Items */}
      <ul className="divide-y divide-[var(--rule)]">
        {category.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>

      {/* Add row */}
      <div className="border-t border-[var(--rule)] px-6 py-4">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded font-[var(--f-ui)] text-[13px] font-medium text-[var(--ink-2)] transition-colors hover:text-[var(--accent)]"
        >
          <Plus size={16} strokeWidth={1.5} />
          Добави в {category.name}
        </button>
      </div>
    </article>
  );
}

function ItemRow({ item }: { item: Item }) {
  return (
    <li className="group flex items-start gap-4 px-6 py-4 transition-colors hover:bg-[var(--bg)]/40">
      <div className="min-w-0 flex-1">
        <input
          type="text"
          defaultValue={item.name}
          className="block w-full bg-transparent font-[var(--f-ui)] text-[15px] font-medium text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
        />
        <input
          type="text"
          defaultValue={item.description}
          placeholder="Кратко описание — пресни домати, краве сирене"
          className="mt-1 block w-full bg-transparent font-[var(--f-ui)] text-[13px] italic leading-[1.5] text-[var(--ink-2)] outline-none placeholder:not-italic placeholder:text-[var(--ink-mute)]/60"
        />
      </div>

      <div className="relative flex items-center">
        <input
          type="text"
          defaultValue={item.price}
          inputMode="decimal"
          className="w-[88px] rounded border border-transparent bg-transparent py-1.5 pr-7 text-right font-[var(--f-mono)] text-[14px] tabular-nums text-[var(--ink)] outline-none transition-colors focus:border-[var(--rule)] focus:bg-[var(--bg)]/50"
        />
        <span className="pointer-events-none absolute right-2 font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
          лв
        </span>
      </div>

      <button
        type="button"
        aria-label={`Изтрий ${item.name}`}
        className="grid size-8 place-items-center rounded text-[var(--ink-mute)] opacity-0 transition-all hover:bg-[var(--bg-2)] hover:text-[var(--accent)] group-hover:opacity-100"
      >
        <Trash2 size={16} strokeWidth={1.5} />
      </button>
    </li>
  );
}
