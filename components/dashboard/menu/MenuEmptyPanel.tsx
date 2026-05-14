"use client";

import { useTranslations } from "next-intl";

import { MenuEmptyState } from "@/components/dashboard/menu/MenuEmptyState";

type MenuEmptyPanelProps = {
  error: string | null;
  onFileSelect: (file: File) => void | Promise<void>;
  onManualEntry: () => void;
};

export function MenuEmptyPanel({
  error,
  onFileSelect,
  onManualEntry,
}: MenuEmptyPanelProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="w-full">
      {error ? (
        <div className="mx-auto mt-8 max-w-3xl rounded-lg border border-[color-mix(in_oklab,var(--bad)_20%,transparent)] bg-[color-mix(in_oklab,var(--bad)_7%,var(--paper))] px-4 py-3 text-sm text-[var(--bad)]">
          {error}
        </div>
      ) : null}
      <MenuEmptyState
        onFileSelect={onFileSelect}
        onManualEntry={onManualEntry}
      />
      {/* Skip affordance — only visible when menu is empty (onboarding context) */}
      <div className="mx-auto w-full max-w-[1080px] flex justify-end px-10 pb-10 max-md:px-6">
        <a
          href="/dashboard"
          className="font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] underline decoration-[var(--rule)] underline-offset-4 transition-colors hover:text-[var(--ink-2)] hover:decoration-[var(--ink-2)]"
        >
          {t("skipForNow")} →
        </a>
      </div>
    </div>
  );
}
