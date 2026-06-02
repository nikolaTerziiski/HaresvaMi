"use client";

import { useTranslations } from "next-intl";

import { MenuEmptyState } from "@/components/dashboard/menu/MenuEmptyState";
import { DASHBOARD_PAGE_X_CLASS } from "@/components/dashboard/shell/page-frame";
import type { EntitlementResult } from "@/lib/billing/entitlements-core";

type MenuEmptyPanelProps = {
  menuImportEntitlement: EntitlementResult;
  onManualEntry: () => void;
};

export function MenuEmptyPanel({
  menuImportEntitlement,
  onManualEntry,
}: MenuEmptyPanelProps) {
  const t = useTranslations("dashboard.menu");

  return (
    <div className="w-full">
      <MenuEmptyState
        menuImportEntitlement={menuImportEntitlement}
        onManualEntry={onManualEntry}
      />
      <div className={`${DASHBOARD_PAGE_X_CLASS} flex justify-end pb-10`}>
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
