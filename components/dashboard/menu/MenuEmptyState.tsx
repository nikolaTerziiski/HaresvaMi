"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Plus, Sparkles, Upload } from "lucide-react";

interface MenuEmptyStateProps {
  onManualEntry: () => void;
}

export function MenuEmptyState({ onManualEntry }: MenuEmptyStateProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="mx-auto w-full max-w-[1080px] px-10 py-12 pb-20 max-md:px-6 max-md:py-8">
      {/* Header */}
      <header className="max-w-[640px]">
        <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("firstTimeEyebrow")}
        </p>
        <h1 className="mt-5 font-[var(--f-display)] text-[44px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[34px]">
          {t.rich("firstTimeTitle", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </h1>
        <p className="mt-4 max-w-[520px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
          {t("firstTimeSubtitle")}
        </p>
      </header>

      {/* Section divider */}
      <div className="mt-12 flex items-center gap-4" aria-hidden>
        <span className="h-px w-10 bg-[var(--accent)]" />
        <span className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--ink-mute)]">
          {t("emptyStepper")}
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>

      {/* Two entry-path cards */}
      <div className="mt-6 grid grid-cols-[1.05fr_0.95fr] gap-6 max-[900px]:grid-cols-1">
        {/* Primary: AI upload */}
        <article className="relative flex flex-col rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
          <div className="flex items-center gap-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
            <Sparkles size={14} strokeWidth={1.5} />
            {t("aiRibbon")}
          </div>
          <h2 className="mt-4 font-[var(--f-display)] text-[28px] font-normal leading-[1.15] text-[var(--ink)]">
            {t.rich("aiCardTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h2>
          <p className="mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
            {t("aiCardDesc")}
          </p>

          {/* Link to new import flow */}
          <Link
            href="/dashboard/menu/import-ai"
            className="mt-6 flex flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-[var(--accent)] bg-[var(--bg)] px-6 py-10 text-center transition-colors hover:bg-[var(--bg-2)]"
          >
            <span className="grid size-12 place-items-center rounded-full border border-[var(--rule)] bg-[var(--paper)] text-[var(--accent)]">
              <Upload size={20} strokeWidth={1.5} />
            </span>
            <span className="text-[14px] text-[var(--ink-2)]">
              {t("aiDemoSource")}
            </span>
            <span className="rounded bg-[var(--accent)] px-6 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)]">
              {t("aiCardCta")}
            </span>
          </Link>

          <p className="mt-4 font-[var(--f-mono)] text-[11px] tracking-wide text-[var(--ink-mute)]">
            JPG · PNG · PDF · до 10 MB
          </p>
        </article>

        {/* Secondary: Manual entry */}
        <article className="flex flex-col rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
          <div className="flex items-center gap-2 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
            <Plus size={14} strokeWidth={1.5} />
            {t("manualCardTitle")}
          </div>
          <h2 className="mt-4 font-[var(--f-display)] text-[28px] font-normal leading-[1.15] text-[var(--ink)]">
            {t.rich("manualCardTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h2>
          <p className="mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
            {t("manualCardDesc")}
          </p>

          <ol className="mt-6 space-y-3 rounded border border-[var(--rule)] bg-[var(--bg)] p-5">
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                01
              </span>
              <span>{t("manualDemoLine1")}</span>
            </li>
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                02
              </span>
              <span>{t("descriptionPlaceholder")}</span>
            </li>
            <li className="flex items-baseline gap-4 text-[13px] leading-[1.5] text-[var(--ink-2)]">
              <span className="font-[var(--f-mono)] text-[11px] text-[var(--ink-mute)]">
                03
              </span>
              <span>{t("manualCardCta")}</span>
            </li>
          </ol>

          <button
            type="button"
            onClick={onManualEntry}
            className="mt-6 inline-flex w-fit items-center gap-2 self-start rounded border border-[var(--ink)] bg-[var(--paper)] px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--ink)] transition-colors hover:bg-[var(--ink)] hover:text-[var(--paper)]"
          >
            {t("manualCardCta")}
            <ChevronRight size={16} strokeWidth={1.5} />
          </button>
        </article>
      </div>
    </div>
  );
}
