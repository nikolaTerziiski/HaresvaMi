"use client";

import {
  Home,
  Menu,
  MessageSquare,
  Settings,
  Tablet,
  Users,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { LogoutButton } from "./LogoutButton";
import { NavLink } from "./NavLink";

type MobileTopbarProps = {
  restaurantName: string;
  ownerFirstName: string;
};

const ICON_PROPS = { className: "h-4 w-4", strokeWidth: 1.75 } as const;

export function MobileTopbar({
  restaurantName,
  ownerFirstName,
}: MobileTopbarProps) {
  const [open, setOpen] = useState(false);
  const nav = useTranslations("dashboard.nav");
  const shell = useTranslations("dashboard.shell");
  const pathname = usePathname();
  const avatarInitial = ownerFirstName ? ownerFirstName.charAt(0) : "?";

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] px-4 py-3 backdrop-blur md:hidden">
        <button
          type="button"
          aria-label={shell("openMenu")}
          onClick={() => setOpen(true)}
          className="inline-grid h-10 w-10 place-items-center rounded-md text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <Menu className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="min-w-0 flex-1 truncate text-center font-[var(--f-display)] text-[18px] leading-none tracking-[-0.01em] text-[var(--ink)]">
          {restaurantName}
        </div>
        <Link
          href="/dashboard/profile"
          aria-label={shell("role.owner")}
          className="grid h-9 w-9 place-items-center rounded-full bg-[var(--plum)] font-[var(--f-display)] text-[16px] italic leading-none text-[var(--paper)] transition hover:opacity-90"
        >
          {avatarInitial}
        </Link>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={shell("closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="relative flex h-full w-[280px] max-w-[85%] flex-col border-r border-[var(--rule)] bg-[var(--bg)] px-4 pb-4 pt-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate px-2 font-[var(--f-display)] text-[22px] leading-[1.05] tracking-[-0.01em] text-[var(--ink)]">
                  {restaurantName}
                </div>
                <span className="ml-2 mt-2 inline-block w-fit rounded-full border border-[var(--rule)] px-2 py-[3px] font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
                  {shell("tierChipFree")}
                </span>
              </div>
              <button
                type="button"
                aria-label={shell("closeMenu")}
                onClick={() => setOpen(false)}
                className="inline-grid h-9 w-9 shrink-0 place-items-center rounded-md text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            <div className="mt-5 h-px bg-[var(--rule)]" />

            <div className="pt-5">
              <div className="px-2 pb-2 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                {nav("groups.work")}
              </div>
              <nav className="flex flex-col gap-[2px]">
                <NavLink href="/dashboard" icon={<Home {...ICON_PROPS} />}>
                  {nav("home")}
                </NavLink>
                <NavLink
                  href="/dashboard/feedback"
                  icon={<MessageSquare {...ICON_PROPS} />}
                >
                  {nav("feedback")}
                </NavLink>
                <NavLink
                  href="/dashboard/menu"
                  icon={<Utensils {...ICON_PROPS} />}
                >
                  {nav("menu")}
                </NavLink>
                <NavLink
                  href="/dashboard/tablet"
                  icon={<Tablet {...ICON_PROPS} />}
                >
                  {nav("tablet")}
                </NavLink>
              </nav>
            </div>

            <div className="pt-5">
              <div className="px-2 pb-2 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--ink-mute)]">
                {nav("groups.account")}
              </div>
              <nav className="flex flex-col gap-[2px]">
                <NavLink href="/dashboard/staff" icon={<Users {...ICON_PROPS} />}>
                  {nav("team")}
                </NavLink>
                <NavLink
                  href="/dashboard/settings"
                  icon={<Settings {...ICON_PROPS} />}
                >
                  {nav("settings")}
                </NavLink>
                <NavLink
                  href="/dashboard/profile"
                  icon={<UserRound {...ICON_PROPS} />}
                >
                  {nav("profile")}
                </NavLink>
              </nav>
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-5">
              <LocaleSwitcher />
              <LogoutButton />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
