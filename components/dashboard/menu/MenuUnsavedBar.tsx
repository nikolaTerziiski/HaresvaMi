"use client";

import { useTranslations } from "next-intl";
import { Loader2, Undo2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MIN_MENU_ITEMS_FOR_NEXT_STEP } from "@/lib/menu/constants";

type MenuUnsavedBarProps = {
  hasUnsavedChanges: boolean;
  validItemCount: number;
  hasValidationErrors: boolean;
  isSaving: boolean;
  canSave: boolean;
  onUndo: () => void;
  onSave: () => void;
};

export function MenuUnsavedBar({
  hasUnsavedChanges,
  validItemCount,
  hasValidationErrors,
  isSaving,
  canSave,
  onUndo,
  onSave,
}: MenuUnsavedBarProps) {
  const t = useTranslations("dashboard.menu");

  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className="sticky bottom-5 z-[60] mx-9 mt-8 flex items-center gap-4 rounded-xl bg-[var(--ink)] px-5 py-3.5 text-[var(--paper)] shadow-[0_20px_40px_-10px_rgba(26,21,18,0.4)] max-md:mx-5 max-md:flex-wrap">
      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--accent-2,var(--accent))]" />
      <div className="min-w-0 flex-1 text-[13px]">
        <b className="text-[var(--paper)]">{t("unsavedTitle")}</b>
        {validItemCount < MIN_MENU_ITEMS_FOR_NEXT_STEP ? (
          <span className="ml-1 text-[color-mix(in_oklab,var(--paper)_60%,transparent)]">
            ·{" "}
            {t("errors.needMoreItems", {
              count: MIN_MENU_ITEMS_FOR_NEXT_STEP,
            })}
          </span>
        ) : hasValidationErrors ? (
          <span className="ml-1 text-[color-mix(in_oklab,var(--paper)_60%,transparent)]">
            · {t("errors.fixBeforeSave")}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onUndo}
        disabled={isSaving}
        className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] text-[color-mix(in_oklab,var(--paper)_70%,transparent)] transition hover:text-[var(--paper)] disabled:opacity-50"
      >
        <Undo2 className="h-3.5 w-3.5" />
        {t("unsavedUndo")}
      </button>
      <Button
        onClick={onSave}
        disabled={!canSave}
        className="h-9 bg-[var(--accent)] px-4 text-[var(--paper)] hover:bg-[var(--plum)] disabled:bg-[color-mix(in_oklab,var(--paper)_20%,transparent)] disabled:text-[color-mix(in_oklab,var(--paper)_50%,transparent)]"
      >
        {isSaving ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : null}
        {isSaving ? t("saving") : t("saveMenu")}
      </Button>
    </div>
  );
}
