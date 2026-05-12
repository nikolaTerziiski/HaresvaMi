import { Home } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

type TopbarProps = {
  ownerFirstName: string;
  greetingKey: "morning" | "afternoon" | "evening";
};

export async function Topbar({ ownerFirstName, greetingKey }: TopbarProps) {
  const [greetings, nav] = await Promise.all([
    getTranslations("dashboard.greetings"),
    getTranslations("dashboard.nav"),
  ]);

  return (
    <div className="sticky top-0 z-20 border-b border-[var(--rule)] bg-[color-mix(in_oklab,var(--bg)_85%,transparent)] backdrop-blur">
      <div className="flex w-full items-center gap-3 px-10 py-[22px] max-md:px-6 max-md:py-[18px]">
        <h1 className="flex-1 font-[var(--f-display)] text-[30px] leading-[1.05] tracking-[-0.02em] text-[var(--ink)] max-md:text-[24px]">
          {greetings(greetingKey)},{" "}
          <em className="not-italic text-[var(--accent)] italic">
            {ownerFirstName}
          </em>
        </h1>
        <Link
          href="/dashboard"
          aria-label={nav("home")}
          title={nav("home")}
          className="inline-grid h-9 w-9 place-items-center rounded-lg text-[var(--ink-2)] transition hover:bg-[var(--paper)] hover:text-[var(--ink)]"
        >
          <Home className="h-[17px] w-[17px]" strokeWidth={1.75} />
        </Link>
      </div>
    </div>
  );
}
