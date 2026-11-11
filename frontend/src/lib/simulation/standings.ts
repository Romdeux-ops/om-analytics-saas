import type { StandingRow } from "@/src/lib/types/standing";

export interface LiveResult {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
}

export interface LiveStandingRow extends StandingRow {
  baseRank: number;
  /** Positif = le club gagne des places. */
  rankDelta: number;
  pointsDelta: number;
  live?: { opponent: string; goalsFor: number; goalsAgainst: number; outcome: "W" | "D" | "L" };
}

/**
 * Classement « si les matchs s'arrêtaient maintenant ».
 * Départage simplifié : points, différence de buts, buts marqués, puis rang de départ.
 * Les zones (C1, relégation…) restent attachées aux places, pas aux clubs.
 */
export function applyLiveResults(base: readonly StandingRow[], results: readonly LiveResult[]): LiveStandingRow[] {
  const zoneByRank = new Map(base.map((row, i) => [i + 1, row.zone]));
  const byClub = new Map(results.flatMap((r) => [
    [r.home, { opponent: r.away, goalsFor: r.homeGoals, goalsAgainst: r.awayGoals }],
    [r.away, { opponent: r.home, goalsFor: r.awayGoals, goalsAgainst: r.homeGoals }],
  ] as const));

  const rows = base.map((row, i): LiveStandingRow => {
    const result = byClub.get(row.clubName);
    if (!result) return { ...row, baseRank: i + 1, rankDelta: 0, pointsDelta: 0 };
    const outcome = result.goalsFor > result.goalsAgainst ? "W" : result.goalsFor < result.goalsAgainst ? "L" : "D";
    const pointsDelta = outcome === "W" ? 3 : outcome === "D" ? 1 : 0;
    return {
      ...row,
      played: row.played + 1,
      won: row.won + (outcome === "W" ? 1 : 0),
      drawn: row.drawn + (outcome === "D" ? 1 : 0),
      lost: row.lost + (outcome === "L" ? 1 : 0),
      goalsFor: row.goalsFor + result.goalsFor,
      goalsAgainst: row.goalsAgainst + result.goalsAgainst,
      points: row.points + pointsDelta,
      baseRank: i + 1,
      rankDelta: 0,
      pointsDelta,
      live: { ...result, outcome },
    };
  });

  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.baseRank - b.baseRank,
  );

  return rows.map((row, i) => ({
    ...row,
    rank: i + 1,
    rankDelta: row.baseRank - (i + 1),
    zone: zoneByRank.get(i + 1),
  }));
}
