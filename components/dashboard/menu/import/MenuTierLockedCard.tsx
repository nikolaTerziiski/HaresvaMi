"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import type { EntitlementResult } from "@/lib/billing/entitlements-core";

type MenuTierLockedCardProps = {
  entitlement: EntitlementResult;
};

export function MenuTierLockedCard({ entitlement }: MenuTierLockedCardProps) {
  const t = useTranslations("dashboard.menu.import.tierLocked");

  const body = t("body", {
    used: entitlement.used,
    limit: entitlement.limit,
  });

  return (
    <div className="mx-auto mt-10 max-w-lg rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-8">
      <p className="mb-2 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--accent)]">
        {t("eyebrow")}
      </p>
      <h2 className="mb-3 font-[var(--f-display)] text-[28px] font-normal leading-[1.1] tracking-[-0.01em] text-[var(--ink)]">
        {t("title")}
      </h2>
      <p className="mb-6 text-[15px] leading-[1.6] text-[var(--ink-2)]">
        {body}
      </p>

      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/dashboard/billing"
          className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 text-[14px] font-medium text-[var(--paper)] no-underline transition-opacity hover:opacity-90"
          style={{
            boxShadow: "0 8px 20px -8px rgba(194,77,44,0.5)",
          }}
        >
          {t("cta")}
        </Link>
        <Link
          href="/dashboard/menu"
          className="font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)] no-underline transition-colors hover:text-[var(--ink-2)]"
        >
          {t("backToMenu")}
        </Link>
      </div>
    </div>
  );
}
