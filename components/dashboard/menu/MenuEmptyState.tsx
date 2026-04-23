"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { FileScan, Keyboard } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MenuEmptyStateProps {
  onFileSelect: (file: File) => void;
  onManualEntry: () => void;
}

export function MenuEmptyState({ onFileSelect, onManualEntry }: MenuEmptyStateProps) {
  const t = useTranslations("dashboard.menu");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="mb-8">
        <p className="mb-4 font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--accent)]">
          {t("emptyEyebrow")}
        </p>
        <h1 className="font-[var(--f-display)] text-3xl leading-none tracking-[-0.02em] text-[var(--ink)] md:text-4xl">
          {t("emptyTitle")}
        </h1>
        <p className="mt-4 max-w-md mx-auto text-[15px] text-[var(--ink-2)]">
          {t("emptyDesc")}
        </p>
      </div>

      <div className="grid gap-6 w-full max-w-3xl md:grid-cols-2">
        <Card className="relative flex flex-col items-center justify-center p-8 text-center transition hover:border-[var(--accent)] hover:shadow-md">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10 text-[var(--accent)]">
            <FileScan className="h-7 w-7" />
          </div>
          <h3 className="font-medium text-[16px] text-[var(--ink)] mb-2">
            {t("magicImportBtn")}
          </h3>
          <p className="text-[14px] text-[var(--ink-2)] mb-6">
            {t("magicImportDesc")}
          </p>
          <Button onClick={() => fileInputRef.current?.click()}>
            {t("magicImportBtn")}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
          />
        </Card>

        <Card className="relative flex flex-col items-center justify-center p-8 text-center transition hover:border-[var(--ink)] hover:shadow-md">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rule)] text-[var(--ink-2)]">
            <Keyboard className="h-7 w-7" />
          </div>
          <h3 className="font-medium text-[16px] text-[var(--ink)] mb-2">
            {t("manualBtn")}
          </h3>
          <p className="text-[14px] text-[var(--ink-2)] mb-6">
            {t("manualDesc")}
          </p>
          <Button variant="outline" onClick={onManualEntry}>
            {t("manualBtn")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
