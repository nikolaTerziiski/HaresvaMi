import type { InsightsDashboardData } from "@/lib/insights/dashboard";

type InsightsSummaryProps = {
  data: InsightsDashboardData;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("bg-BG").format(value);
}

function formatRating(value: number | null) {
  return value === null ? "няма" : `${value.toFixed(1).replace(".", ",")}/5`;
}

function formatPercent(value: number | null) {
  return value === null ? "няма" : `${value.toFixed(1).replace(".", ",")}%`;
}

function deltaLabel(
  current: number | null,
  previous: number | null,
  currentCount: number,
  previousCount: number,
) {
  if (
    current === null ||
    previous === null ||
    currentCount < 3 ||
    previousCount < 3
  ) {
    return "Сравнението ще започне след още данни.";
  }

  const delta = Math.round((current - previous) * 10) / 10;
  if (delta === 0) return "Без промяна спрямо предишните 7 дни.";

  const arrow = delta > 0 ? "▲" : "▼";
  const sign = delta > 0 ? "+" : "";

  return `${arrow} ${sign}${delta.toFixed(1).replace(".", ",")} спрямо предишните 7 дни`;
}

function sessionsDeltaLabel(current: number, previous: number) {
  if (previous === 0) {
    return "Сравнението ще започне след още една седмица с отзиви.";
  }

  const delta = current - previous;
  if (delta === 0) return "Същият брой като предишните 7 дни.";

  const arrow = delta > 0 ? "▲" : "▼";
  const sign = delta > 0 ? "+" : "";

  return `${arrow} ${sign}${formatNumber(delta)} спрямо предишните 7 дни`;
}

export function InsightsSummary({ data }: InsightsSummaryProps) {
  const cards = [
    {
      label: "Завършени отзиви",
      value: formatNumber(data.current.completedSessions),
      helper: sessionsDeltaLabel(
        data.current.completedSessions,
        data.previous.completedSessions,
      ),
    },
    {
      label: "Средна оценка на ястия",
      value: formatRating(data.current.itemAverage),
      helper: deltaLabel(
        data.current.itemAverage,
        data.previous.itemAverage,
        data.current.itemRatingCount,
        data.previous.itemRatingCount,
      ),
    },
    {
      label: "Харесва ми",
      value: formatPercent(data.current.likeRate),
      helper: deltaLabel(
        data.current.likeRate,
        data.previous.likeRate,
        data.current.overallResponseCount,
        data.previous.overallResponseCount,
      ),
    },
  ];

  return (
    <section className="grid grid-cols-3 gap-4 max-[900px]:grid-cols-1">
      {cards.map((card) => (
        <article
          key={card.label}
          className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] px-5 py-4"
        >
          <p className="m-0 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.08em] text-[var(--ink-mute)]">
            {card.label}
          </p>
          <div className="mt-3 font-[var(--f-display)] text-[42px] leading-none text-[var(--ink)]">
            {card.value}
          </div>
          <p className="mt-3 mb-0 text-[13px] leading-[1.5] text-[var(--ink-2)]">
            {card.helper}
          </p>
        </article>
      ))}
    </section>
  );
}
