"use client";

import { useState } from "react";

import type { InsightPeriod } from "@/lib/insights/types";

export type InsightsAiSummaryProps = {
  period: InsightPeriod;
  tier: string;
  trialActive: boolean;
  initialSummary: {
    summaryText: string;
    generatedAt: string;
  } | null;
};

type SummaryState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; summaryText: string; generatedAt: string }
  | { kind: "error"; message: string };

function formatRelativeTime(generatedAt: string): string {
  const diffMs = Date.now() - new Date(generatedAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (hours < 1) return "току-що";
  if (hours < 24) return `преди ${hours} ч.`;

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (days === 1) return "преди 1 ден";

  return `преди ${days} дни`;
}

export function InsightsAiSummary({
  period,
  tier,
  trialActive,
  initialSummary,
}: InsightsAiSummaryProps) {
  const isPro = tier === "pro" || trialActive;

  const [state, setState] = useState<SummaryState>(
    initialSummary
      ? {
          kind: "loaded",
          summaryText: initialSummary.summaryText,
          generatedAt: initialSummary.generatedAt,
        }
      : { kind: "idle" },
  );

  async function requestSummary(force = false) {
    setState({ kind: "loading" });

    try {
      const res = await fetch("/api/insights/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period, force }),
      });

      const json = (await res.json()) as {
        summaryText?: string;
        generatedAt?: string;
        error?: string;
        message?: string;
      };

      if (!res.ok || !json.summaryText) {
        const message =
          json.error === "not_enough_data"
            ? "Нужни са поне 10 завършени отзива в избрания период."
            : (json.message ??
              "Не успяхме да генерираме резюме. Опитай отново след малко.");

        setState({ kind: "error", message });
        return;
      }

      setState({
        kind: "loaded",
        summaryText: json.summaryText,
        generatedAt: json.generatedAt ?? new Date().toISOString(),
      });
    } catch {
      setState({
        kind: "error",
        message: "Не успяхме да генерираме резюме. Опитай отново след малко.",
      });
    }
  }

  if (!isPro) {
    return <LockedCard />;
  }

  if (state.kind === "idle") {
    return <EmptyCard onGenerate={() => requestSummary(false)} />;
  }

  if (state.kind === "loading") {
    return <LoadingCard />;
  }

  if (state.kind === "error") {
    return (
      <EmptyCard
        onGenerate={() => requestSummary(false)}
        error={state.message}
      />
    );
  }

  return (
    <ProseCard
      summaryText={state.summaryText}
      generatedAt={state.generatedAt}
      onRegenerate={() => requestSummary(true)}
    />
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--rule)] bg-[var(--paper)] p-6">
      {children}
    </div>
  );
}

function CardHeader() {
  return (
    <div className="mb-3">
      <p className="mb-1 font-[var(--f-mono)] text-[10px] uppercase tracking-[0.1em] text-[var(--accent)]">
        Pro прозрения
      </p>
      <h2 className="m-0 font-[var(--f-display)] text-[22px] font-normal leading-[1.1] text-[var(--ink)]">
        Седмично резюме на български
      </h2>
    </div>
  );
}

function LockedCard() {
  return (
    <CardShell>
      <CardHeader />
      <p className="mt-3 text-[15px] leading-[1.6] text-[var(--ink-2)]">
        Pro план обобщава какво се случва с менюто ти, с една-две изречения. Без
        графики, без жаргон.
      </p>
      <div className="mt-5 flex items-center gap-4">
        <a
          href="/dashboard/billing"
          className="inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] no-underline transition-opacity hover:opacity-90"
        >
          Обнови до Pro
        </a>
        <span className="font-[var(--f-ui)] text-[13px] italic text-[var(--ink-mute)]">
          От €10/месец
        </span>
      </div>
    </CardShell>
  );
}

function EmptyCard({
  onGenerate,
  error,
}: {
  onGenerate: () => void;
  error?: string;
}) {
  return (
    <CardShell>
      <CardHeader />
      {error ? (
        <p className="mt-3 text-[14px] leading-[1.5] text-[var(--ink-mute)]">
          {error}
        </p>
      ) : (
        <p className="mt-3 text-[15px] leading-[1.6] text-[var(--ink-2)]">
          Генерирай кратко резюме на случилото се в избрания период.
        </p>
      )}
      <button
        onClick={onGenerate}
        className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] transition-opacity hover:opacity-90"
      >
        Генерирай резюме
      </button>
    </CardShell>
  );
}

function LoadingCard() {
  return (
    <CardShell>
      <CardHeader />
      <button
        disabled
        className="mt-4 inline-block rounded-lg bg-[var(--accent)] px-5 py-2.5 font-[var(--f-ui)] text-[14px] font-medium text-[var(--paper)] opacity-60"
      >
        Генерира...
      </button>
    </CardShell>
  );
}

function ProseCard({
  summaryText,
  generatedAt,
  onRegenerate,
}: {
  summaryText: string;
  generatedAt: string;
  onRegenerate: () => void;
}) {
  const relative = formatRelativeTime(generatedAt);

  return (
    <CardShell>
      <CardHeader />
      <p className="mt-4 border-l-2 border-[var(--accent)] pl-4 text-[16px] leading-[1.6] text-[var(--ink-2)]">
        {summaryText}
      </p>
      <div className="mt-4 flex items-center gap-4">
        <span className="font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)]">
          Обновено {relative}
        </span>
        <button
          onClick={onRegenerate}
          className="font-[var(--f-ui)] text-[13px] text-[var(--ink-mute)] underline underline-offset-2 transition-colors hover:text-[var(--ink-2)]"
        >
          Регенерирай
        </button>
      </div>
    </CardShell>
  );
}
