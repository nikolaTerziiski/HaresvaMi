"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import type { DishCandidate } from "@/lib/insights/dashboard";
import type { DishTrendPoint } from "@/lib/insights/trends";

// Code-split recharts (~150KB) so the rest of the insights page renders fast.
// The chart is only visible after the user scrolls and picks a dish, so loading
// it lazily is a clean win — no SSR needed because the chart is client-only.
const LineChart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), {
  ssr: false,
});
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false },
);
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => m.ResponsiveContainer),
  { ssr: false },
);

type DishTrendChartProps = {
  candidates: DishCandidate[];
};

const bgDateFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "2-digit",
  month: "short",
  timeZone: "Europe/Sofia",
});

const bgDateLongFormatter = new Intl.DateTimeFormat("bg-BG", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Sofia",
});

function formatWeekLabel(weekStart: string): string {
  return bgDateFormatter.format(new Date(weekStart));
}

function formatWeekLong(weekStart: string): string {
  return bgDateLongFormatter.format(new Date(weekStart));
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number | null; payload: DishTrendPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;

  return (
    <div
      style={{
        backgroundColor: "var(--ink)",
        color: "var(--paper)",
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 12,
        fontFamily: "var(--f-ui)",
        lineHeight: 1.6,
      }}
    >
      <p style={{ margin: 0, fontWeight: 500 }}>
        {label ? formatWeekLong(label) : ""}
      </p>
      {point.avgRating !== null ? (
        <p style={{ margin: 0 }}>
          Оценка:{" "}
          <span style={{ fontFamily: "var(--f-mono)" }}>{point.avgRating}</span>
        </p>
      ) : (
        <p style={{ margin: 0 }}>Няма данни</p>
      )}
      <p style={{ margin: 0 }}>
        Отзиви:{" "}
        <span style={{ fontFamily: "var(--f-mono)" }}>{point.sampleCount}</span>
      </p>
    </div>
  );
}

export function DishTrendChart({ candidates }: DishTrendChartProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    candidates[0]?.menuItemId ?? null,
  );
  const [trend, setTrend] = useState<DishTrendPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/insights/dish-trend?menuItemId=${selectedId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Грешка при зареждане");
        return res.json() as Promise<{ trend: DishTrendPoint[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          setTrend(data.trend);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Грешка при зареждане");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  if (candidates.length === 0) {
    return (
      <p
        style={{
          color: "var(--ink-mute)",
          fontSize: 14,
          fontFamily: "var(--f-ui)",
          margin: 0,
        }}
      >
        Все още няма данни за тренд по ястие.
      </p>
    );
  }

  const totalCount = trend
    ? trend.reduce((sum, p) => sum + p.sampleCount, 0)
    : 0;

  return (
    <div style={{ fontFamily: "var(--f-ui)" }}>
      <select
        value={selectedId ?? ""}
        onChange={(e) => setSelectedId(e.target.value)}
        style={{
          fontFamily: "var(--f-ui)",
          fontSize: 14,
          color: "var(--ink)",
          backgroundColor: "var(--paper)",
          border: "1px solid var(--rule)",
          borderRadius: 6,
          padding: "6px 10px",
          marginBottom: 20,
          cursor: "pointer",
          outline: "none",
        }}
      >
        {candidates.map((c) => (
          <option key={c.menuItemId} value={c.menuItemId}>
            {c.name} · {c.sampleCount} отзива
          </option>
        ))}
      </select>

      {loading ? (
        <p
          style={{
            color: "var(--ink-mute)",
            fontSize: 14,
            margin: 0,
          }}
        >
          Зарежда...
        </p>
      ) : error ? (
        <p
          style={{
            color: "var(--ink-mute)",
            fontSize: 14,
            margin: 0,
          }}
        >
          {error}
        </p>
      ) : trend ? (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={trend}
            margin={{ top: 8, right: 16, bottom: 0, left: -16 }}
          >
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--rule)"
              vertical={false}
            />
            <XAxis
              dataKey="weekStart"
              tickFormatter={formatWeekLabel}
              tick={{
                fontSize: 11,
                fill: "var(--ink-mute)",
                fontFamily: "var(--f-ui)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{
                fontSize: 11,
                fill: "var(--ink-mute)",
                fontFamily: "var(--f-mono)",
              }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: "var(--rule)", strokeDasharray: "3 3" }}
            />
            <Line
              type="monotone"
              dataKey="avgRating"
              stroke="var(--accent)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
              activeDot={{ r: 5, fill: "var(--accent)", strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : null}

      {trend && (
        <p
          style={{
            marginTop: 12,
            fontSize: 13,
            color: "var(--ink-mute)",
            fontFamily: "var(--f-ui)",
          }}
        >
          Базирано на {totalCount} отзива за последните 12 седмици
        </p>
      )}
    </div>
  );
}
