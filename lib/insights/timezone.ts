const SOFIA_TZ = "Europe/Sofia";

/** Offset (Sofia wall-clock minus UTC), in ms, for the given instant. */
function sofiaOffsetMs(instant: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: SOFIA_TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = dtf.formatToParts(instant);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return asUtc - instant.getTime();
}

/** UTC instant of 00:00:00.000 Sofia local time on the given YYYY-MM-DD. */
export function sofiaStartOfDayUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  // Sample the offset at local noon (never inside a DST transition, which
  // happens at 03:00/04:00) and apply it to local midnight.
  const noonGuess = Date.UTC(y, m - 1, d, 12, 0, 0, 0);
  const offset = sofiaOffsetMs(new Date(noonGuess));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0) - offset);
}

/** UTC instant of 23:59:59.999 Sofia local time on the given YYYY-MM-DD. */
export function sofiaEndOfDayUtc(dateStr: string): Date {
  const start = sofiaStartOfDayUtc(dateStr);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** The YYYY-MM-DD calendar date in Sofia for the given instant. */
export function sofiaDateStr(instant: Date): string {
  return instant.toLocaleDateString("en-CA", { timeZone: SOFIA_TZ });
}
