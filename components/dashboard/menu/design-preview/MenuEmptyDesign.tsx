"use client";

import { ChevronRight, Plus, Sparkles, Upload } from "lucide-react";

/**
 * DESIGN PREVIEW — not wired to the real menu flow.
 * Renders the "first time, no items yet" state for /dashboard/menu.
 */
export function MenuEmptyDesign() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-10 py-12 pb-20 max-md:px-6 max-md:py-8">
      {/* Header */}
      <header className="max-w-[640px]">
        <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          Стъпка 02 · Меню
        </p>
        <h1 className="mt-5 font-[var(--f-display)] text-[44px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[34px]">
          Сега да добавим <em className="italic">менюто</em> ти.
        </h1>
        <p className="mt-4 max-w-[520px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
          Това е стъпката преди клиентите да започнат да оценяват ястията ти.
          Качи снимка на менюто или го въведи ръчно — както ти е удобно.
        </p>
      </header>

      {/* Decorative section divider */}
      <div className="mt-12 flex items-center gap-4" aria-hidden>
        <span className="h-px w-10 bg-[var(--accent)]" />
        <span className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--ink-mute)]">
          Избери начин
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>

      {/* Two entry-path cards */}
      <div className="mt-6 grid grid-cols-[1.05fr_0.95fr] gap-6 max-[900px]:grid-cols-1">
        {/* Primary: AI upload */}
        <article className="relative flex flex-col rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
          <div className="flex items-center gap-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
            <Sparkles size={14} strokeWidth={1.5} />
            Бързо
          </div>
          <h2 className="mt-4 font-[var(--f-display)] text-[28px] font-normal leading-[1.15] text-[var(--ink)]">
            Качи снимка или PDF на менюто
          </h2>
          <p className="mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
            AI чете ястията за около 30 секунди. После можеш да коригираш
            всичко.
          </p>

          <label
            htmlFor="menu-file"
            className="mt-6 flex cursor-pointer flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-[var(--accent)] bg-[var(--bg)] px-6 py-10 text-center transition-colors hover:bg-[var(--bg-2)]"
          >
            <span className="grid size-12 place-items-center rounded-full border border-[var(--rule)] bg-[var(--paper)] text-[var(--accent)]">
              <Upload size={20} strokeWidth={1.5} />
            </span>
            <span className="text-[14px] text-[var(--ink-2)]">
              Пусни файл тук или
            </span>
            <span className="rounded bg-[var(--accent)] px-6 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)]">
              Избери файл
            </span>
            <input
              id="menu-file"
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
            />
          </label>

          <p className="mt-4 font-[var(--f-mono)] text-[11px] tracking-wide text-[var(--ink-mute)]">
            JPG · PNG · PDF · до 10 MB
          </p>
        </article>

        {/* Secondary: Manual entry */}
        <article className="flex flex-col rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
          <div className="flex items-center gap-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
            <Plus size={14} strokeWidth={1.5} />
            На ръка
          </div>
          <h2 className="mt-4 font-[var(--f-display)] text-[28px] font-normal leading-[1.15] text-[var(--ink)]">
            Или въведи ястията <em className="italic">на ръка</em>
          </h2>
          <p className="mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
            Ако нямаш дигитално меню или предпочиташ да започнеш от нулата с
            пълен контрол върху всеки ред.
          </p>

          <ol className="mt-6 space-y-3 rounded border border-[var(--rule)] bg-[var(--bg)] p-5">
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                01
              </span>
              <span>Добавяш ястие, категория и цена</span>
            </li>
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                02
              </span>
              <span>Опционално кратко описание</span>
            </li>
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                03
              </span>
              <span>Запазваш — готово</span>
            </li>
          </ol>

          <button
            type="button"
            className="mt-auto inline-flex w-fit items-center gap-2 self-start rounded border border-[var(--ink)] bg-[var(--paper)] px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            style={{ marginTop: "24px" }}
          >
            Започни ръчно
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </article>
      </div>

      {/* Skip link */}
      <div className="mt-10 flex justify-end">
        <a
          href="/dashboard"
          className="font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--ink-2)] hover:decoration-[var(--ink-2)]"
        >
          Готово засега — ще го направя по-късно →
        </a>
      </div>
    </div>
  );
}
