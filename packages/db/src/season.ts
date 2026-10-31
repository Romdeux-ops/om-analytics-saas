/** Année de début de saison : 2026 pour 2026-2027 (bascule au 1er juillet). */
export function currentSeasonYear(now = new Date()): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/** "long" → "2026-2027", "short" → "2026/27". */
export function formatSeason(startYear = currentSeasonYear(), style: "long" | "short" = "long"): string {
  const endYear = startYear + 1;
  return style === "long" ? `${startYear}-${endYear}` : `${startYear}/${String(endYear).slice(-2)}`;
}
