import type { InsightPeriod, InsightPeriodKey } from "@/lib/insights/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function toSofiaStartOfDay(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(
    new Date(year, month - 1, day).toLocaleString("en-US", {
      timeZone: "Europe/Sofia",
    }),
  );
}

function toSofiaEndOfDay(dateStr: string): Date {
  const start = toSofiaStartOfDay(dateStr);
  return new Date(start.getTime() + DAY_MS - 1);
}

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
    const currentFrom = toSofiaStartOfDay(input.from);
    const currentTo = toSofiaEndOfDay(input.to);
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
  const currentTo = now;
  const currentFrom = new Date(currentTo.getTime() - days * DAY_MS);
  const previousTo = currentFrom;
  const previousFrom = new Date(previousTo.getTime() - days * DAY_MS);

  return {
    key: input.key === "month" ? "month" : "week",
    currentFrom: currentFrom.toISOString(),
    currentTo: currentTo.toISOString(),
    previousFrom: previousFrom.toISOString(),
    previousTo: previousTo.toISOString(),
  };
}
