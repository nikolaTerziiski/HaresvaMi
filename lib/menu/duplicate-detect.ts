function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("bg-BG")
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  if (m === 0) return n;
  if (n === 0) return m;

  const prev: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  const curr: number[] = new Array<number>(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= n; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[n];
}

export function findDuplicate(
  candidate: { name_bg: string },
  existing: { id: string; name_bg: string }[],
): { id: string; name: string } | null {
  const candidateNorm = normalize(candidate.name_bg);

  for (const item of existing) {
    const existingNorm = normalize(item.name_bg);

    // Exact normalized match
    if (candidateNorm === existingNorm) {
      return { id: item.id, name: item.name_bg };
    }

    // Prefix match — both must be at least 4 chars
    if (candidateNorm.length >= 4 && existingNorm.length >= 4) {
      if (
        candidateNorm.startsWith(existingNorm) ||
        existingNorm.startsWith(candidateNorm)
      ) {
        return { id: item.id, name: item.name_bg };
      }
    }

    // Levenshtein distance ≤ 2
    if (levenshtein(candidateNorm, existingNorm) <= 2) {
      return { id: item.id, name: item.name_bg };
    }
  }

  return null;
}
