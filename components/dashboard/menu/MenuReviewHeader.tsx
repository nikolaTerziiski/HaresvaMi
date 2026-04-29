"use client";

import { useTranslations } from "next-intl";

type MenuReviewHeaderProps = {
  totalItems: number;
  categoryCount: number;
};

export function MenuReviewHeader({
  totalItems,
  categoryCount,
}: MenuReviewHeaderProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <section className="grid items-end gap-10 border-b border-[var(--rule-soft,var(--rule))] px-9 pt-9 pb-6 md:grid-cols-[1fr_auto] max-md:px-5">
      <div>
        <span className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
          {t("reviewStepper")}
        </span>
        <h1 className="mt-2 font-[var(--f-display)] text-[44px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[32px]">
          {t.rich("reviewTitle", {
            em: (chunks) => (
              <em className="italic text-[var(--accent)]">{chunks}</em>
            ),
          })}
        </h1>
        <p className="mt-2 max-w-[560px] text-[15px] leading-[1.55] text-[var(--ink-2)]">
          {t("reviewDesc")}
        </p>
      </div>
      <div className="flex items-end gap-7 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        <div>
          <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
            {totalItems}
          </span>
          {t("statProducts")}
        </div>
        <div>
          <span className="block font-[var(--f-display)] text-[40px] italic leading-[0.9] tracking-[-0.02em] text-[var(--ink)]">
            {categoryCount}
          </span>
          {t("statCategories")}
        </div>
      </div>
    </section>
  );
}
