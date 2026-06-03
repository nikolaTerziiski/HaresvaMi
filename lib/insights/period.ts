import type { InsightPeriod, InsightPeriodKey } from "@/lib/insights/types";
import {
  sofiaStartOfDayUtc,
  sofiaEndOfDayUtc,
  sofiaDateStr,
} from "@/lib/insights/timezone";

const DAY_MS = 24 * 60 * 60 * 1000;

function isValidDateStr(value: string | undefined): value is string {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));
}

export function resolveInsightPeriod(input: {
  key: InsightPeriodKey;
  from?: string;
  to?: string;
  now?: Date;
}): InsightPeriod {
  const now = input.now ?? new Date();

  if (
    input.key === "custom" &&
    isValidDateStr(input.from) &&
    isValidDateStr(input.to)
  ) {
    const currentFrom = sofiaStartOfDayUtc(input.from);
    const currentTo = sofiaEndOfDayUtc(input.to);
    const lengthMs = currentTo.getTime() - currentFrom.getTime();
    const previousTo = new Date(currentFrom.getTime() - 1);
    const previousFrom = new Date(previousTo.getTime() - lengthMs);

    return {
      key: "custom",
      currentFrom: currentFrom.toISOString(),
      currentTo: currentTo.toISOString(),
      previousFrom: previousFrom.toISOString(),
      previousTo: previousTo.toISOString(),
    };
  }

  const days = input.key === "month" ? 30 : 7;
  const todayStr = sofiaDateStr(now);
  const currentTo = sofiaEndOfDayUtc(todayStr);
  const currentFrom = new Date(currentTo.getTime() - days * DAY_MS + 1);
  const previousTo = new Date(currentFrom.getTime() - 1);
  const previousFrom = new Date(previousTo.getTime() - days * DAY_MS + 1);

  return {
    key: input.key === "month" ? "month" : "week",
    currentFrom: currentFrom.toISOString(),
    currentTo: currentTo.toISOString(),
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
  };
}
