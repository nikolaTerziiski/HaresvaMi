"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { FileText, Keyboard, Sparkles } from "lucide-react";

interface MenuEmptyStateProps {
  onFileSelect: (file: File) => void;
  onManualEntry: () => void;
}

export function MenuEmptyState({
  onFileSelect,
  onManualEntry,
}: MenuEmptyStateProps) {
  const t = useTranslations("dashboard.menu");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
      e.target.value = "";
    }
  };

  return (
    <div className="w-full">
      <section className="grid items-end gap-10 border-b border-[var(--rule-soft,var(--rule))] px-9 pt-9 pb-6 md:grid-cols-[1fr_auto] max-md:px-5">
        <div>
          <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            {t("emptyStepper")}
          </span>
          <h1 className="mt-2 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
            {t.rich("emptyTitle", {
              em: (chunks) => (
                <em className="italic text-[var(--accent)]">{chunks}</em>
              ),
            })}
          </h1>
          <p className="mt-2 max-w-[560px] text-[15px] leading-[1.55] text-[var(--ink-2)]">
            {t("emptyLead")}
          </p>
        </div>
        <StatBlock products={0} categories={0} />
      </section>

      <div className="mx-auto max-w-[960px] px-9 pt-7 pb-16 max-md:px-5">
        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-[14px] border border-[var(--rule)] bg-[linear-gradient(160deg,var(--paper)_0%,var(--bg-2,var(--rule))_100%)] p-8 pt-8 text-left transition hover:-translate-y-[2px] hover:border-[var(--ink)] hover:shadow-[0_30px_50px_-30px_rgba(26,21,18,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            <span className="absolute top-4 right-4 inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 font-[var(--f-mono)] text-[9px] uppercase tracking-[0.1em] text-[var(--paper)]">
              {t("aiRibbon")}
            </span>
            <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-[var(--accent)] bg-[var(--accent)] text-[var(--paper)]">
              <Sparkles className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="font-[var(--f-display)] text-[26px] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--ink)]">
              {t.rich("aiCardTitle", {
                em: (chunks) => (
                  <em className="italic text-[var(--accent)]">{chunks}</em>
                ),
              })}
            </h3>
            <p className="max-w-[320px] text-[13px] leading-[1.55] text-[var(--ink-2)]">
              {t("aiCardDesc")}
            </p>
            <div className="flex flex-col gap-1 rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] px-3.5 py-3 font-[var(--f-mono)] text-[11px] leading-[1.4] text-[var(--ink-2)]">
              <span>
                {t("aiDemoSource")}{" "}
                <span className="text-[var(--accent)]">→</span>
              </span>
              <span className="text-[var(--ink)]">{t("aiDemoResult")}</span>
            </div>
            <div className="mt-auto flex gap-3.5 border-t border-dashed border-[var(--rule)] pt-3 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> PDF
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> {t("aiDemoTagPhoto")}
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="h-3 w-3" /> XLS
              </span>
            </div>
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4.5 py-2.5 text-[13px] font-medium text-[var(--paper)]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
              {t("aiCardCta")}
            </span>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
            />
          </button>

          <button
            type="button"
            onClick={onManualEntry}
            className="group relative flex flex-col gap-3 overflow-hidden rounded-[14px] border border-[var(--rule)] bg-[var(--paper)] p-8 pt-8 text-left transition hover:-translate-y-[2px] hover:border-[var(--ink)] hover:shadow-[0_30px_50px_-30px_rgba(26,21,18,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
          >
            <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-[var(--rule)] bg-[var(--bg)] text-[var(--accent)]">
              <Keyboard className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <h3 className="font-[var(--f-display)] text-[26px] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--ink)]">
              {t("manualCardTitle")}
            </h3>
            <p className="max-w-[320px] text-[13px] leading-[1.55] text-[var(--ink-2)]">
              {t("manualCardDesc")}
            </p>
            <div className="flex flex-col gap-1 rounded-lg border border-dashed border-[var(--rule)] bg-[var(--bg)] px-3.5 py-3 font-[var(--f-mono)] text-[11px] leading-[1.4] text-[var(--ink-2)]">
              <span>{t("manualDemoLine1")}</span>
              <span>{t("manualDemoLine2")}</span>
            </div>
            <div className="mt-auto flex gap-3.5 border-t border-dashed border-[var(--rule)] pt-3 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
              <span className="inline-flex items-center gap-1">
                <Keyboard className="h-3 w-3" /> {t("manualDemoTagKeyboard")}
              </span>
              <span>Tab / Enter</span>
            </div>
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-[var(--ink)] px-4.5 py-2.5 text-[13px] font-medium text-[var(--paper)]">
              {t("manualCardCta")}
            </span>
          </button>
        </div>

        <div className="mt-8 grid gap-6 border-t border-[var(--rule-soft,var(--rule))] pt-6 md:grid-cols-3">
          <HelpCell title={t("helpTitle1")} body={t("helpBody1")} />
          <HelpCell title={t("helpTitle2")} body={t("helpBody2")} />
          <HelpCell title={t("helpTitle3")} body={t("helpBody3")} />
        </div>
      </div>
    </div>
  );
}

function StatBlock({
  products,
  categories,
}: {
  products: number;
  categories: number;
}) {
  const t = useTranslations("dashboard.menu");
  return (
    <div className="flex items-end gap-7 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
      <div>
        <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
          {products}
        </span>
        {t("statProducts")}
      </div>
      <div>
        <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
          {categories}
        </span>
        {t("statCategories")}
      </div>
    </div>
  );
}

function HelpCell({ title, body }: { title: string; body: string }) {
  return (
    <div className="text-[13px] leading-[1.55] text-[var(--ink-2)]">
      <b className="mb-1 block font-[var(--f-display)] text-[18px] font-medium tracking-[-0.01em] text-[var(--ink)]">
        {title}
      </b>
      {body}
    </div>
  );
}
