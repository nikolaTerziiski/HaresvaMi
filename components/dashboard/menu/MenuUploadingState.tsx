"use client";

import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";

export function MenuUploadingState() {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="flex min-h-[520px] w-full flex-col items-center justify-center px-6 text-center">
      <Loader2 className="mb-4 h-10 w-10 animate-spin text-[var(--accent)]" />
      <h2 className="text-xl font-medium text-[var(--ink)]">
        {t("uploading")}
      </h2>
    </div>
  );
}
