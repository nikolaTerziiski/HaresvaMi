import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { LocaleSwitcher } from "./LocaleSwitcher";
import { LogoutButton } from "./LogoutButton";

type TopbarProps = {
  ownerFirstName: string;
  greetingKey: "morning" | "afternoon" | "evening";
};

export async function Topbar({ ownerFirstName, greetingKey }: TopbarProps) {
  const [greetings, shell] = await Promise.all([
    getTranslations("dashboard.greetings"),
    getTranslations("dashboard.shell"),
  ]);

  const avatarInitial = ownerFirstName ? ownerFirstName.charAt(0) : "?";

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur max-md:hidden">
      <div className="flex w-full items-center gap-6 px-10 py-[18px] max-md:px-6 max-md:py-[14px]">
        <h1 className="flex-1 font-[var(--f-display)] text-[30px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)] max-md:text-[24px]">
          {greetings(greetingKey)},{" "}
          <em className="not-italic text-[var(--accent)] italic">
            {ownerFirstName}
          </em>
        </h1>

        <div className="flex items-center gap-5">
          <LocaleSwitcher />
          <div
            className="h-5 w-px bg-[var(--rule)]"
            aria-hidden="true"
          />
          <Link
            href="/dashboard/profile"
            aria-label={shell("role.owner")}
            title={shell("role.owner")}
            className="grid h-9 w-9 place-items-center rounded-full bg-[var(--plum)] font-[var(--f-display)] text-[18px] italic leading-none text-[var(--paper)] transition hover:opacity-90"
          >
            {avatarInitial}
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
