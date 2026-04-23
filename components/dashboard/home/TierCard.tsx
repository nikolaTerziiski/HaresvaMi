import { getTranslations } from "next-intl/server";

type TierCardProps = {
  used: number;
  limit: number;
};

export async function TierCard({ used, limit }: TierCardProps) {
  const t = await getTranslations("dashboard.home.tier");

  const ratio = limit > 0 ? Math.min(1, used / limit) : 0;

  return (
    <article className="flex h-full flex-col rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-[26px] py-6">
      <div className="mb-[2px] flex items-start justify-between">
        <h3 className="m-0 font-[var(--f-display)] text-[22px] font-normal leading-[1.25] tracking-[-0.01em] text-[var(--ink)]">
          {t("title")}
        </h3>
        <span className="rounded-full border border-[var(--rule)] px-2 py-[2px] font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
          {t("current")}
        </span>
      </div>

      <p className="mt-3 mb-5 text-[13px] text-[var(--ink-mute)]">
        {t("usage", { used, limit })}
      </p>

      <div className="h-[3px] overflow-hidden rounded-[2px] bg-[var(--rule)]">
        <span
          className="block h-full bg-[var(--accent)]"
          style={{ width: `${Math.round(ratio * 100)}%` }}
        />
      </div>

      <p className="mt-[18px] max-w-[340px] text-[13px] leading-[1.55] text-[var(--ink-2)]">
        {t("blurb")}
      </p>

      <button
        type="button"
        className="mt-5 inline-flex w-fit items-center rounded-lg border border-[var(--ink)] bg-transparent px-[18px] py-[10px] text-[13px] font-medium text-[var(--ink)] transition hover:bg-[var(--ink)] hover:text-[var(--paper)]"
      >
        {t("cta")}
      </button>
    </article>
  );
}
