"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronRight, Lock, Plus, Sparkles, Upload } from "lucide-react";

import { DASHBOARD_PAGE_FRAME_CLASS } from "@/components/dashboard/shell/page-frame";
import type { EntitlementResult } from "@/lib/billing/entitlements-core";

type MenuEmptyStateProps = {
  menuImportEntitlement: EntitlementResult;
  onManualEntry: () => void;
};

export function MenuEmptyState({
  menuImportEntitlement,
  onManualEntry,
}: MenuEmptyStateProps) {
  const t = useTranslations("dashboard.menu");
  const aiLocked = !menuImportEntitlement.allowed;

  return (
    <div className={DASHBOARD_PAGE_FRAME_CLASS}>
      <header className="max-w-[720px]">
        <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
          {t("firstTimeEyebrow")}
        </p>
        <h1 className="mt-5 font-[var(--f-display)] text-[44px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[34px]">
          {t.rich("firstTimeTitle", {
            em: (chunks) => <em className="italic">{chunks}</em>,
          })}
        </h1>
        <p className="mt-4 max-w-[620px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
          {t("firstTimeSubtitle")}
        </p>
      </header>

      <div className="mt-12 flex items-center gap-4" aria-hidden>
        <span className="h-px w-10 bg-[var(--accent)]" />
        <span className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.18em] text-[var(--ink-mute)]">
          {t("emptyStepper")}
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>

      <div className="mt-6 grid grid-cols-[1.05fr_0.95fr] gap-6 max-[900px]:grid-cols-1">
        <article className="relative flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-6">
          <div
            className={[
              "flex flex-1 flex-col transition",
              aiLocked ? "pointer-events-none select-none blur-[2px]" : "",
            ].join(" ")}
            aria-hidden={aiLocked}
          >
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

            {aiLocked ? (
              <div className="mt-6 flex flex-1 min-h-[180px] flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-[var(--accent)] bg-[var(--bg)] px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-full border border-[var(--rule)] bg-[var(--paper)] text-[var(--accent)]">
                  <Upload size={20} strokeWidth={1.5} />
                </span>
                <span className="text-[14px] text-[var(--ink-2)]">
                  {t("aiDemoSource")}
                </span>
                <span className="rounded bg-[var(--accent)] px-6 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)]">
                  {t("aiCardCta")}
                </span>
              </div>
            ) : (
              <Link
                href="/dashboard/menu/import-ai"
                className="mt-6 flex flex-1 min-h-[180px] flex-col items-center justify-center gap-4 rounded border-2 border-dashed border-[var(--accent)] bg-[var(--bg)] px-6 py-10 text-center transition-colors hover:bg-[var(--bg-2)]"
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
            )}

            <p className="mt-4 font-[var(--f-mono)] text-[11px] tracking-wide text-[var(--ink-mute)]">
              JPG · PNG · PDF · до 10 MB
            </p>
          </div>

          {aiLocked ? (
            <div className="absolute inset-0 z-10 grid place-items-center bg-[color-mix(in_oklab,var(--paper)_78%,transparent)] px-6 backdrop-blur-[3px]">
              <div className="max-w-[340px] text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-full border border-[var(--rule)] bg-[var(--paper)] text-[var(--accent)]">
                  <Lock size={19} strokeWidth={1.6} />
                </span>
                <p className="mt-4 mb-2 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
                  {t("aiLockedEyebrow")}
                </p>
                <h3 className="m-0 font-[var(--f-display)] text-[26px] font-normal leading-[1.1] text-[var(--ink)]">
                  {t("aiLockedTitle")}
                </h3>
                <p className="mt-3 mb-0 text-[14px] leading-[1.55] text-[var(--ink-2)]">
                  {t("aiLockedBody")}
                </p>
                <Link
                  href="/dashboard/settings"
                  className="mt-5 inline-flex rounded-md bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--paper)] transition-colors hover:bg-[var(--ink)]"
                >
                  {t("aiLockedCta")}
                </Link>
              </div>
            </div>
          ) : null}
        </article>

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
