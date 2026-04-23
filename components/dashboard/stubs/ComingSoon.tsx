import { getTranslations } from "next-intl/server";

type ComingSoonProps = {
  scope:
    | "feedback"
    | "menu"
    | "tablet"
    | "team"
    | "settings"
    | "profile";
};

export async function ComingSoon({ scope }: ComingSoonProps) {
  const t = await getTranslations("dashboard.stubs");

  return (
    <div className="mx-auto max-w-5xl px-10 py-10 max-md:px-6 max-md:py-8">
      <section className="rounded-[14px] border border-[var(--rule)] bg-[var(--paper)] p-10 max-md:p-6">
        <p className="font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
          {t("comingSoon")}
        </p>
        <h1 className="mt-3 font-[var(--f-display)] text-[40px] font-normal leading-[1.02] tracking-[-0.02em] text-[var(--ink)] max-md:text-[30px]">
          {t(`${scope}.title`)}
        </h1>
        <p className="mt-4 max-w-[520px] text-[15px] leading-[1.55] text-[var(--ink-2)]">
          {t(`${scope}.description`)}
        </p>
      </section>
    </div>
  );
}
