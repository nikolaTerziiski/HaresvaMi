import {
  Home,
  MessageSquare,
  Utensils,
  Tablet,
  Users,
  Settings,
  UserRound,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { LogoutButton } from "./LogoutButton";
import { NavLink } from "./NavLink";

type SidebarProps = {
  restaurantName: string;
  ownerFirstName: string;
};

const ICON_PROPS = { className: "h-4 w-4", strokeWidth: 1.75 } as const;

export async function Sidebar({
  restaurantName,
  ownerFirstName,
}: SidebarProps) {
  const [nav, shell] = await Promise.all([
    getTranslations("dashboard.nav"),
    getTranslations("dashboard.shell"),
  ]);

  const avatarInitial = ownerFirstName ? ownerFirstName.charAt(0) : "?";

  return (
    <aside
      aria-label="Dashboard navigation"
      className="sticky top-0 flex h-dvh w-[240px] shrink-0 flex-col border-r border-[var(--rule)] bg-[var(--bg)] px-4 pb-4 pt-5"
    >
      <div className="px-2 font-[var(--f-display)] text-[22px] leading-[1.05] tracking-[-0.01em] text-[var(--ink)]">
        {restaurantName}
      </div>
      <span className="mt-2 inline-block w-fit rounded-full border border-[var(--rule)] px-2 py-[3px] font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
        {shell("tierChipFree")}
      </span>

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
          <NavLink href="/dashboard/menu" icon={<Utensils {...ICON_PROPS} />}>
            {nav("menu")}
          </NavLink>
          <NavLink href="/dashboard/tablet" icon={<Tablet {...ICON_PROPS} />}>
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

      <div className="mt-auto flex flex-col gap-4 pt-5">
        <LocaleSwitcher />
        <div className="flex items-center gap-[10px]">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--plum)] font-[var(--f-display)] text-[18px] italic leading-none text-[var(--paper)]">
            {avatarInitial}
          </div>
          <div className="text-[13px]">
            <div className="font-medium text-[var(--ink)]">
              {ownerFirstName}
            </div>
            <div className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.06em] text-[var(--ink-mute)]">
              {shell("role.owner")}
            </div>
          </div>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
