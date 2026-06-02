"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight, Check, Plus } from "lucide-react";

import { DASHBOARD_PAGE_FRAME_CLASS } from "@/components/dashboard/shell/page-frame";
import { SUGGESTED_MANUAL_CATEGORIES } from "@/lib/menu/constants";
import { categoryColorFor, categoryKey } from "@/lib/menu/format";

type MenuManualStarterProps = {
  initialCategories?: string[];
  protectedCategories?: string[];
  onContinue: (categories: string[]) => void;
  onBack: () => void;
};

export function MenuManualStarter({
  initialCategories = [],
  protectedCategories = [],
  onContinue,
  onBack,
}: MenuManualStarterProps) {
  const t = useTranslations("dashboard.menu.manualStarter");

  const protectedKeys = useMemo(
    () => new Set(protectedCategories.map(categoryKey)),
    [protectedCategories],
  );
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set([...initialCategories, ...protectedCategories]),
  );
  const [customInput, setCustomInput] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  function toggleCategory(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        if (protectedKeys.has(categoryKey(cat))) return next;
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function addCustomCategory() {
    const trimmed = customInput.trim();
    if (!trimmed) return;

    const existsAlready = Array.from(selected).some(
      (s) =>
        s.trim().toLocaleLowerCase("bg-BG") ===
        trimmed.toLocaleLowerCase("bg-BG"),
    );
    if (existsAlready) {
      setCustomInput("");
      customInputRef.current?.focus();
      return;
    }

    setSelected((prev) => new Set([...prev, trimmed]));
    setCustomInput("");
    customInputRef.current?.focus();
  }

  function handleCustomKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomCategory();
    }
  }

  const customCategories = Array.from(selected).filter(
    (s) =>
      !(SUGGESTED_MANUAL_CATEGORIES as readonly string[]).some(
        (suggested) => categoryKey(suggested) === categoryKey(s),
      ),
  );

  const canContinue = selected.size > 0;

  return (
    <div className={DASHBOARD_PAGE_FRAME_CLASS}>
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink-2)]"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        {t("back")}
      </button>

      <header className="max-w-[520px]">
        <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 font-[var(--f-display)] text-[40px] font-normal leading-[1.05] text-[var(--ink)] max-md:text-[30px]">
          {t("title")}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-[var(--ink-2)]">
          {t("subtitle")}
        </p>
      </header>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4 max-sm:flex-col max-sm:items-start">
          <p className="m-0 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
            {t("suggestionsLabel")}
          </p>
          {selected.size > 0 ? (
            <p className="m-0 font-[var(--f-mono)] text-[12px] text-[var(--ink-mute)]">
              {t("selectedCount", { count: selected.size })}
            </p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {[...SUGGESTED_MANUAL_CATEGORIES, ...customCategories].map((cat) => {
            const isSelected = selected.has(cat);
            const isProtected = protectedKeys.has(categoryKey(cat));

            return (
              <button
                key={cat}
                type="button"
                aria-pressed={isSelected}
                aria-disabled={isProtected}
                onClick={() => toggleCategory(cat)}
                className={[
                  "group flex min-h-[180px] flex-col justify-between rounded-lg border p-6 text-left transition-colors max-sm:min-h-[150px] max-sm:p-4",
                  isSelected
                    ? "border-[var(--good)] bg-[var(--good)] text-[var(--paper)] shadow-[0_14px_36px_rgba(26,21,18,0.08)]"
                    : "border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-2)] hover:border-[var(--ink)] hover:bg-[var(--bg-2)]",
                  isProtected ? "cursor-default" : "",
                ].join(" ")}
              >
                <span className="flex items-start justify-between gap-3">
                  <span
                    className="mt-1 size-3 rounded-full"
                    style={{
                      backgroundColor: isSelected
                        ? "var(--paper)"
                        : categoryColorFor(cat),
                    }}
                    aria-hidden="true"
                  />
                  <span
                    className={[
                      "grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                      isSelected
                        ? "border-[var(--paper)] bg-[var(--paper)] text-[var(--good)]"
                        : "border-[var(--rule)] bg-[var(--paper)] text-[var(--ink-mute)] group-hover:border-[var(--ink)]",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    {isSelected ? <Check size={18} strokeWidth={1.9} /> : null}
                  </span>
                </span>
                <span className="block font-[var(--f-display)] text-[34px] leading-[1.02] max-sm:text-[24px]">
                  {cat}
                </span>
                {isProtected ? (
                  <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.12em] opacity-75">
                    {t("protectedLabel")}
                  </span>
                ) : null}
              </button>
            );
          })}

          <div className="flex min-h-[180px] flex-col justify-between rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] p-6 max-sm:min-h-[150px] max-sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <span className="grid size-10 place-items-center rounded-full border border-[var(--rule)] text-[var(--accent)]">
                <Plus size={20} strokeWidth={1.7} />
              </span>
              <button
                type="button"
                onClick={addCustomCategory}
                className="rounded border border-[var(--rule)] bg-transparent px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)] max-sm:px-2"
              >
                {t("customAdd")}
              </button>
            </div>
            <input
              ref={customInputRef}
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={handleCustomKeyDown}
              placeholder={t("customPlaceholder")}
              className="mt-6 min-h-10 w-full rounded border border-[var(--rule)] bg-[var(--bg)] px-3 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)]"
            />
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-col items-start gap-2">
        <button
          type="button"
          disabled={!canContinue}
          onClick={() => onContinue(Array.from(selected))}
          className="inline-flex items-center gap-2 rounded bg-[var(--accent)] px-6 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)] disabled:pointer-events-none disabled:opacity-40"
        >
          {t("continue")}
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>

        {!canContinue ? (
          <p className="font-[var(--f-ui)] text-[12px] text-[var(--ink-mute)]">
            {t("minOne")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
