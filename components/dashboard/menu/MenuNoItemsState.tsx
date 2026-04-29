"use client";

import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type MenuNoItemsStateProps = {
  isFiltering: boolean;
  onAddItem: () => void;
};

export function MenuNoItemsState({
  isFiltering,
  onAddItem,
}: MenuNoItemsStateProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="mx-auto max-w-[560px] rounded-lg border border-dashed border-[var(--rule)] bg-[var(--paper)] px-6 py-10 text-center">
      <h2 className="text-[20px] font-medium text-[var(--ink)]">
        {isFiltering ? t("noMatchTitle") : t("reviewEmptyTitle")}
      </h2>
      <p className="mx-auto mt-2 max-w-[420px] text-[14px] leading-[1.55] text-[var(--ink-2)]">
        {isFiltering ? t("noMatchDesc") : t("reviewEmptyDesc")}
      </p>
      {!isFiltering ? (
        <Button
          variant="outline"
          onClick={onAddItem}
          className="mt-5 h-10 px-4"
        >
          <Plus className="h-4 w-4" />
          {t("table.add")}
        </Button>
      ) : null}
    </div>
  );
}
