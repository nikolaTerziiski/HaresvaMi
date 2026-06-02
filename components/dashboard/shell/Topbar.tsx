"use client";

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { LogoutButton } from "./LogoutButton";

type TopbarProps = {
  restaurantName: string;
  ownerFirstName: string;
};

const SECTION_KEYS = [
  { prefix: "/dashboard/menu/import-ai", key: "menuImport" },
  { prefix: "/dashboard/insights", key: "insights" },
  { prefix: "/dashboard/feedback", key: "feedback" },
  { prefix: "/dashboard/menu", key: "menu" },
  { prefix: "/dashboard/tablet", key: "tablet" },
  { prefix: "/dashboard/settings", key: "settings" },
] as const;

function getSectionKey(pathname: string) {
  const match = SECTION_KEYS.find((section) =>
    pathname.startsWith(section.prefix),
  );

  return match?.key ?? "home";
}

export function Topbar({ restaurantName, ownerFirstName }: TopbarProps) {
  const shell = useTranslations("dashboard.shell");
  const pathname = usePathname();

  const avatarInitial = ownerFirstName ? ownerFirstName.charAt(0) : "?";
  const sectionKey = getSectionKey(pathname);

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur max-md:hidden">
      <div className="flex w-full items-center gap-6 px-10 py-[14px]">
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
            {restaurantName}
          </p>
          <h1 className="m-0 mt-1 font-[var(--f-display)] text-[30px] leading-[1.05] tracking-[-0.01em] text-[var(--ink)]">
            {shell(`sections.${sectionKey}.title`)}
          </h1>
          <p className="m-0 mt-1 text-[13px] leading-[1.4] text-[var(--ink-mute)]">
            {shell(`sections.${sectionKey}.hint`)}
          </p>
        </div>

        <div className="flex items-center gap-5">
          <LocaleSwitcher />
          <div className="h-5 w-px bg-[var(--rule)]" aria-hidden="true" />
          <div
            aria-label={shell("role.owner")}
            title={shell("role.owner")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--plum)] font-[var(--f-display)] text-[18px] italic leading-none text-[var(--paper)] transition hover:opacity-90"
          >
            {avatarInitial}
          </div>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
