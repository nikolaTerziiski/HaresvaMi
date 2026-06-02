"use client";

import { useTranslations } from "next-intl";

type MenuReviewHeaderProps = {
  totalItems: number;
  categoryCount: number;
  canEditCategories: boolean;
  onEditCategories: () => void;
};

export function MenuReviewHeader({
  totalItems,
  categoryCount,
  canEditCategories,
  onEditCategories,
}: MenuReviewHeaderProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <header className="pb-0">
      <div className="flex items-end justify-between gap-6 max-md:flex-col max-md:items-start">
        <div className="max-w-[680px]">
          <p className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--accent)]">
            {t("reviewStepper")}
          </p>
          <h1 className="mt-5 font-[var(--f-display)] text-[40px] font-normal leading-[1.05] tracking-[-0.01em] text-[var(--ink)] max-md:text-[32px]">
            {t.rich("reviewTitle", {
              em: (chunks) => <em className="italic">{chunks}</em>,
            })}
          </h1>
          <p className="mt-4 max-w-[540px] text-[15px] leading-[1.6] text-[var(--ink-2)]">
            {t("reviewDesc")}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-4 max-md:items-start">
          {canEditCategories ? (
            <button
              type="button"
              onClick={onEditCategories}
              className="rounded border border-[var(--rule)] bg-[var(--paper)] px-4 py-2 font-[var(--f-ui)] text-[13px] text-[var(--ink-2)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
            >
              {t("editCategories")}
            </button>
          ) : null}

          <div className="flex items-center gap-6 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.14em] text-[var(--ink-mute)]">
            <div className="text-right max-md:text-left">
              <span className="block font-[var(--f-display)] text-[36px] font-normal leading-none text-[var(--ink)]">
                {totalItems}
              </span>
              {t("statProducts")}
            </div>
            <div className="text-right max-md:text-left">
              <span className="block font-[var(--f-display)] text-[36px] font-normal leading-none text-[var(--ink)]">
                {categoryCount}
              </span>
              {t("statCategories")}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
