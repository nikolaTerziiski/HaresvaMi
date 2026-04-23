import { Bell } from "lucide-react";
import { getTranslations } from "next-intl/server";

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
    <div className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-10 py-[22px] max-md:px-6 max-md:py-[18px]">
        <h1 className="flex-1 font-[var(--f-display)] text-[30px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)] max-md:text-[24px]">
          {greetings(greetingKey)},{" "}
          <em className="not-italic text-[var(--accent)] italic">
            {ownerFirstName}
          </em>
        </h1>
        <button
          type="button"
          aria-label={shell("notifications")}
          className="inline-grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)] max-md:hidden"
        >
          <Bell className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-2 rounded-lg py-1 pl-1 pr-3 text-[13px] text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full bg-[var(--plum)] font-[var(--f-display)] text-[16px] italic leading-none text-[var(--paper)]">
            {avatarInitial}
          </span>
        </button>
      </div>
    </div>
  );
}
