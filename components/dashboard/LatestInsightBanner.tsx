import Link from "next/link";

type InsightSummary = {
  summary_text: string;
  period_start: string;
  period_end: string;
  generated_at: string;
};

type LatestInsightBannerProps = {
  /** Server-rendered — null if no insight exists yet. */
  summary: InsightSummary | null;
};

const formatter = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatPeriod(start: string, end: string): string {
  try {
    const s = formatter.format(new Date(start));
    const e = formatter.format(new Date(end));
    return `${s} – ${e}`;
  } catch {
    return `${start} – ${end}`;
  }
}

/**
 * Displays the latest AI insight summary above the dashboard charts.
 * Shown even when push is unavailable — the dashboard is the fallback.
 * Renders nothing if no summary exists yet.
 */
export function LatestInsightBanner({ summary }: LatestInsightBannerProps) {
  if (!summary) return null;

  const period = formatPeriod(summary.period_start, summary.period_end);

  return (
    <div className="mb-6 rounded-lg border border-[var(--rule)] bg-[var(--paper)] p-5">
      <p className="m-0 mb-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
        Седмично обобщение
      </p>
      <p className="m-0 mb-1 text-[12px] text-[var(--ink-mute)]">{period}</p>
      <p className="m-0 text-[15px] leading-[1.6] text-[var(--ink)]">
        {summary.summary_text}
      </p>
      <Link
        href="/dashboard/insights"
        className="mt-3 inline-block text-[13px] font-medium text-[var(--accent)] hover:underline"
      >
        Виж пълните данни →
      </Link>
    </div>
  );
}
