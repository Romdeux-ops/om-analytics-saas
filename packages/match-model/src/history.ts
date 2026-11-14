/** Historique de matchs de Ligue 1 (football-data.co.uk) et outils associés. Hors navigateur. */

export interface MatchStats {
  hs: number; as: number; hst: number; ast: number;
  hf: number; af: number; hc: number; ac: number;
  hy: number; ay: number; hr: number; ar: number;
}

export interface HistoryMatch {
  /** Code saison football-data.co.uk : « 2627 » = 2026-27. */
  season: string;
  /** AAAA-MM-JJ. */
  date: string;
  /** Jours depuis le 1er janvier 1970 (UTC). */
  day: number;
  home: string;
  away: string;
  hg: number;
  ag: number;
  hthg: number | null;
  htag: number | null;
  stats: MatchStats | null;
  /** Cotes décimales brutes de clôture et préfixe de colonne d'origine (« AvgC », « PSC »). */
  odds: { h: number; d: number; a: number; column: string } | null;
  xg: { h: number; a: number } | null;
}

/** Format compact stocké dans `data/ligue1-history.json`. */
export interface HistoryFile {
  generatedAt: string;
  source: string;
  columns: string[];
  matches: (string | number | null)[][];
}

export const HISTORY_COLUMNS = [
  "season", "date", "home", "away", "hg", "ag", "hthg", "htag",
  "hs", "as", "hst", "ast", "hf", "af", "hc", "ac", "hy", "ay", "hr", "ar",
  "oddsH", "oddsD", "oddsA", "oddsColumn", "hxg", "axg",
] as const;

export function dayNumber(isoDate: string): number {
  const [y, m, d] = isoDate.slice(0, 10).split("-").map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86_400_000);
}

export const seasonLabel = (code: string): string => `20${code.slice(0, 2)}-${code.slice(2)}`;

/** Code saison (« 2627 ») d'un match daté : la saison démarre en juillet. */
export function seasonCodeOf(isoDate: string): string {
  const [y, m] = isoDate.slice(0, 7).split("-").map(Number);
  const start = m >= 7 ? y : y - 1;
  return `${String(start % 100).padStart(2, "0")}${String((start + 1) % 100).padStart(2, "0")}`;
}

export function decodeHistory(file: HistoryFile): HistoryMatch[] {
  const ix = (name: string) => file.columns.indexOf(name);
  const num = (row: (string | number | null)[], name: string) => row[ix(name)] as number | null;
  const out = file.matches.map((row): HistoryMatch => {
    const date = row[ix("date")] as string;
    const hs = num(row, "hs");
    const oddsH = num(row, "oddsH");
    const hxg = num(row, "hxg");
    return {
      season: row[ix("season")] as string,
      date,
      day: dayNumber(date),
      home: row[ix("home")] as string,
      away: row[ix("away")] as string,
      hg: num(row, "hg")!,
      ag: num(row, "ag")!,
      hthg: num(row, "hthg"),
      htag: num(row, "htag"),
      stats:
        hs === null
          ? null
          : {
              hs, as: num(row, "as")!, hst: num(row, "hst")!, ast: num(row, "ast")!,
              hf: num(row, "hf")!, af: num(row, "af")!, hc: num(row, "hc")!, ac: num(row, "ac")!,
              hy: num(row, "hy")!, ay: num(row, "ay")!, hr: num(row, "hr")!, ar: num(row, "ar")!,
            },
      odds: oddsH === null ? null : { h: oddsH, d: num(row, "oddsD")!, a: num(row, "oddsA")!, column: row[ix("oddsColumn")] as string },
      xg: hxg === null ? null : { h: hxg, a: num(row, "axg")! },
    };
  });
  out.sort((a, b) => a.day - b.day);
  return out;
}

/** Clubs par saison, d'après les matchs fournis. */
export function seasonTeams(matches: readonly Pick<HistoryMatch, "season" | "home" | "away">[]): Record<string, string[]> {
  const sets: Record<string, Set<string>> = {};
  for (const m of matches) {
    (sets[m.season] ??= new Set()).add(m.home).add(m.away);
  }
  return Object.fromEntries(Object.entries(sets).map(([s, set]) => [s, [...set].sort()]));
}

/** Probabilités implicites : normalisation proportionnelle (on divise par la somme des inverses). */
export function oddsProportional(o: { h: number; d: number; a: number }): [number, number, number] {
  const inv = [1 / o.h, 1 / o.d, 1 / o.a];
  const s = inv[0] + inv[1] + inv[2];
  return [inv[0] / s, inv[1] / s, inv[2] / s];
}

/**
 * Probabilités implicites : méthode de la puissance (on cherche k tel que Σ (1/cote)^k = 1).
 * Retire davantage de marge aux outsiders, ce qui corrige le biais favori-outsider.
 */
export function oddsPower(o: { h: number; d: number; a: number }): [number, number, number] {
  const inv = [1 / o.h, 1 / o.d, 1 / o.a];
  let lo = 0.5;
  let hi = 2;
  for (let i = 0; i < 60; i++) {
    const k = (lo + hi) / 2;
    const s = inv[0] ** k + inv[1] ** k + inv[2] ** k;
    if (s > 1) lo = k;
    else hi = k;
  }
  const k = (lo + hi) / 2;
  const p = inv.map((x) => x ** k);
  const s = p[0] + p[1] + p[2];
  return [p[0] / s, p[1] / s, p[2] / s];
}
