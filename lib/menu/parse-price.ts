/**
 * Parses a price value from a Bulgarian menu into a float.
 *
 * Accepts: 12.90, 12,90, "12.50 лв", "12,90лв.", "12 ,90", "  12,90 BGN  "
 * Returns null for empty, whitespace-only, unparseable, or negative inputs.
 */
export function parseBgPrice(input: string | number | null): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  if (typeof input === "number") {
    return isFinite(input) && input >= 0 ? input : null;
  }

  const trimmed = input.trim();
  if (trimmed === "") {
    return null;
  }

  // Strip currency suffix: лв, лв., BGN (case-insensitive), € sign
  let cleaned = trimmed
    .replace(/лв\.?\s*$/iu, "")
    .replace(/bgn\s*$/iu, "")
    .replace(/€\s*$/u, "")
    .trim();

  // Collapse internal whitespace around decimal separator (e.g. "12 ,90")
  cleaned = cleaned.replace(/\s+/g, "");

  // Replace comma decimal separator with dot
  cleaned = cleaned.replace(",", ".");

  const value = parseFloat(cleaned);

  if (!isFinite(value) || value < 0) {
    return null;
  }

  return value;
}
