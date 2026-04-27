import { Play } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function TutorialCard() {
  const t = await getTranslations("dashboard.home.tutorial");

  const steps = [t("step1"), t("step2"), t("step3")];

  return (
    <article className="flex h-full flex-col rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-[26px] py-6">
      <h3 className="m-0 font-[var(--f-display)] text-[22px] font-normal leading-[1.25] tracking-[-0.01em] text-[var(--ink)]">
        {t("title")}
      </h3>
      <p className="mt-3 mb-5 text-[13px] text-[var(--ink-mute)]">
        {t("subtitle")}
      </p>

      <ol className="m-0 list-none p-0">
        {steps.map((step, idx) => (
          <li
            key={idx}
            className="flex gap-4 border-t border-[var(--rule)] py-3 text-[14px] leading-[1.55] text-[var(--ink-2)] first:border-t-0 first:pt-0"
          >
            <span className="shrink-0 font-[var(--f-display)] text-[15px] italic text-[var(--accent)]">
              0{idx + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>

      <button
        type="button"
        className="mt-[18px] -ml-2 inline-flex w-fit items-center gap-2 rounded-md px-2 py-2 text-[13px] text-[var(--ink-2)] transition hover:bg-[color-mix(in_oklab,var(--paper)_60%,transparent)] hover:text-[var(--ink)]"
      >
        <Play
          className="h-[13px] w-[13px]"
          strokeWidth={0}
          fill="currentColor"
        />
        {t("cta")}
      </button>
    </article>
  );
}
