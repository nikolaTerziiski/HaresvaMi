"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { InsightPeriodKey } from "@/lib/insights/types";

type PeriodSwitcherProps = {
  currentKey: InsightPeriodKey;
  currentFrom: string;
  currentTo: string;
};

const pills: { key: InsightPeriodKey; label: string }[] = [
  { key: "week", label: "Тази седмица" },
  { key: "month", label: "Този месец" },
  { key: "custom", label: "Друг период" },
];

function isoToDateInput(iso: string) {
  return iso.slice(0, 10);
}

export function PeriodSwitcher({
  currentKey,
  currentFrom,
  currentTo,
}: PeriodSwitcherProps) {
  const router = useRouter();
  const [from, setFrom] = useState(isoToDateInput(currentFrom));
  const [to, setTo] = useState(isoToDateInput(currentTo));

  function pushPeriod(key: InsightPeriodKey) {
    if (key === "custom") {
      router.push(`/dashboard/insights?period=custom&from=${from}&to=${to}`);
    } else {
      router.push(`/dashboard/insights?period=${key}`);
    }
  }

  function applyCustom() {
    router.push(`/dashboard/insights?period=custom&from=${from}&to=${to}`);
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => {
          const active = currentKey === pill.key;

          return (
            <button
              key={pill.key}
              type="button"
              onClick={() => pushPeriod(pill.key)}
              className={
                active
                  ? "rounded-full px-4 py-1.5 font-[var(--f-ui)] text-[13px] font-medium bg-[var(--ink)] text-[var(--paper)]"
                  : "rounded-full px-4 py-1.5 font-[var(--f-ui)] text-[13px] font-medium bg-transparent text-[var(--ink-2)] border border-[var(--rule)] hover:bg-[var(--bg-2)] transition-colors"
              }
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {currentKey === "custom" && (
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="period-from"
              className="font-[var(--f-ui)] text-[12px] text-[var(--ink-mute)] uppercase tracking-[0.06em]"
            >
              От
            </label>
            <input
              id="period-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none focus:border-[var(--ink-2)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="period-to"
              className="font-[var(--f-ui)] text-[12px] text-[var(--ink-mute)] uppercase tracking-[0.06em]"
            >
              До
            </label>
            <input
              id="period-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border border-[var(--rule)] bg-[var(--paper)] px-3 py-1.5 font-[var(--f-ui)] text-[14px] text-[var(--ink)] outline-none focus:border-[var(--ink-2)]"
            />
          </div>

          <button
            type="button"
            onClick={applyCustom}
            className="rounded-md bg-[var(--accent)] px-4 py-2 font-[var(--f-ui)] text-[13px] font-medium text-[var(--paper)] hover:opacity-90 transition-opacity"
          >
            Приложи
          </button>
        </div>
      )}
    </div>
  );
}
