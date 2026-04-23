"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { persistLocale } from "@/lib/i18n/browser";
import { locales, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const t = useTranslations("dashboard.shell.language");
  const active = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (next: Locale) => {
    if (next === active || isPending) return;
    persistLocale(next);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex gap-[2px] font-[var(--f-mono)] text-[11px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
      {locales.map((locale, index) => (
        <span key={locale} className="flex items-center gap-[2px]">
          <button
            type="button"
            onClick={() => switchTo(locale)}
            className={[
              "cursor-pointer px-[6px] py-[2px] transition",
              active === locale
                ? "border-b border-[var(--accent)] text-[var(--ink)]"
                : "hover:text-[var(--ink-2)]",
            ].join(" ")}
          >
            {t(locale)}
          </button>
          {index < locales.length - 1 ? <span>/</span> : null}
        </span>
      ))}
    </div>
  );
}
