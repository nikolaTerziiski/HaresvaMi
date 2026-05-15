"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { SUGGESTED_MANUAL_CATEGORIES } from "@/lib/menu/constants";

type MenuManualStarterProps = {
  onContinue: (categories: string[]) => void;
  onBack: () => void;
};

export function MenuManualStarter({
  onContinue,
  onBack,
}: MenuManualStarterProps) {
  const t = useTranslations("dashboard.menu.manualStarter");

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customInput, setCustomInput] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  const activeChipClass =
    "inline-flex items-center gap-2 rounded-full border border-[var(--ink)] bg-[var(--ink)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)]";
  const inactiveChipClass =
    "inline-flex items-center gap-2 rounded-full border border-[var(--rule)] bg-[var(--paper)] px-3.5 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]";

  function toggleCategory(cat: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
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

  // Custom chips: ones not in the suggested list
  const customChips = Array.from(selected).filter(
    (s) => !(SUGGESTED_MANUAL_CATEGORIES as readonly string[]).includes(s),
  );

  const canContinue = selected.size > 0;

  return (
    <div className="mx-auto w-full max-w-[720px] px-10 py-12 pb-20 max-md:px-6 max-md:py-8">
      {/* Back link */}
      <button
        type="button"
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] transition-colors hover:text-[var(--ink-2)]"
      >
        <ArrowLeft size={14} strokeWidth={1.5} />
        {t("back")}
      </button>

      {/* Header */}
      <header className="max-w-[520px]">
        <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("eyebrow")}
        </p>
        <h1 className="mt-5 font-[var(--f-display)] text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[30px]">
          {t("title")}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-[var(--ink-2)]">
          {t("subtitle")}
        </p>
      </header>

      {/* Category picker card */}
      <div className="mt-10 rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
        <p className="mb-4 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
          {t("suggestionsLabel")}
        </p>

        {/* Suggested chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_MANUAL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={
                selected.has(cat) ? activeChipClass : inactiveChipClass
              }
            >
              {cat}
            </button>
          ))}

          {/* Custom chips */}
          {customChips.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              className={activeChipClass}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Custom category input */}
        <div className="mt-5 flex items-center gap-2">
          <input
            ref={customInputRef}
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={handleCustomKeyDown}
            placeholder={t("customPlaceholder")}
            className="min-h-9 flex-1 rounded border border-[var(--rule)] bg-[var(--bg)] px-3 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)] focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={addCustomCategory}
            className="inline-flex items-center gap-1 rounded border border-[var(--rule)] bg-transparent px-3 py-1.5 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
          >
            + {t("customAdd")}
          </button>
        </div>
      </div>

      {/* Count + continue */}
      <div className="mt-6 flex flex-col items-start gap-2">
        {selected.size > 0 ? (
          <p className="font-[var(--f-mono)] text-[12px] text-[var(--ink-mute)]">
            {t("selectedCount", { count: selected.size })}
          </p>
        ) : null}

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
