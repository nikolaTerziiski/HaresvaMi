export const BGN_PER_EUR = 1.95583;

export function bgnToEur(bgn: number): number {
  return bgn / BGN_PER_EUR;
}

export function formatBgn(value: number): string {
  return value.toFixed(2);
}

export function formatEur(value: number): string {
  return value.toFixed(2);
}
