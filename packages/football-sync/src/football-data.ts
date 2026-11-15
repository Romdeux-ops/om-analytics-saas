import type { SnapshotFixture, SnapshotStanding, SnapshotStandingZone } from "@om/db";
import { toParisIso } from "./dates";
import { canonicalTeamName } from "./teams";

/** API officielle gratuite (10 req/min) : https://www.football-data.org/documentation/quickstart */
const BASE_URL = "https://api.football-data.org/v4";
const OM_TEAM_ID = 516;
const LIGUE1_CODE = "FL1";

interface FdTeam {
  name: string;
  shortName?: string | null;
  tla?: string | null;
}

interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  homeTeam: FdTeam;
  awayTeam: FdTeam;
  score: { fullTime: { home: number | null; away: number | null } };
}

interface FdStandingsResponse {
  standings: {
    type: string;
    table: {
      position: number;
      team: FdTeam;
      playedGames: number;
      won: number;
      draw: number;
      lost: number;
      points: number;
      goalsFor: number;
      goalsAgainst: number;
    }[];
  }[];
}

async function request<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: { "X-Auth-Token": token } });
  if (!res.ok) {
    throw new Error(`football-data.org ${path} → HTTP ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

const teamName = (team: FdTeam) => canonicalTeamName(team.shortName, team.name, team.tla);

/** Zones Ligue 1 : C1 (1-2), Europa League (4), Conference League (5), relégation (3 derniers). */
function ligue1Zone(rank: number, total: number): SnapshotStandingZone | undefined {
  if (rank <= 2) return "champions-league";
  if (rank === 4) return "europa-league";
  if (rank === 5) return "conference-league";
  if (rank > total - 3) return "relegation";
  return undefined;
}

export async function fetchLigue1(
  token: string,
  seasonYear: number,
): Promise<{ fixtures: SnapshotFixture[]; standings: SnapshotStanding[] }> {
  const [{ matches }, { standings }] = await Promise.all([
    request<{ matches: FdMatch[] }>(
      `/teams/${OM_TEAM_ID}/matches?competitions=${LIGUE1_CODE}&season=${seasonYear}`,
      token,
    ),
    request<FdStandingsResponse>(`/competitions/${LIGUE1_CODE}/standings?season=${seasonYear}`, token),
  ]);

  const fixtures: SnapshotFixture[] = matches.map((m) => {
    const { home, away } = m.score.fullTime;
    const played = (m.status === "FINISHED" || m.status === "AWARDED") && home !== null && away !== null;
    return {
      competition: "ligue1",
      matchday: m.matchday ?? 0,
      homeTeam: teamName(m.homeTeam),
      awayTeam: teamName(m.awayTeam),
      date: toParisIso(m.utcDate),
      // SCHEDULED = date connue mais horaire non fixé ; TIMED = horaire confirmé.
      timeTbd: m.status === "SCHEDULED",
      played,
      ...(played ? { homeScore: home, awayScore: away } : {}),
    };
  });

  const table = standings.find((s) => s.type === "TOTAL")?.table ?? [];
  const rows: SnapshotStanding[] = table.map((row) => ({
    rank: row.position,
    clubName: teamName(row.team),
    played: row.playedGames,
    won: row.won,
    drawn: row.draw,
    lost: row.lost,
    goalsFor: row.goalsFor,
    goalsAgainst: row.goalsAgainst,
    points: row.points,
    zone: ligue1Zone(row.position, table.length),
  }));

  if (fixtures.length === 0 || rows.length === 0) {
    throw new Error(`football-data.org : réponse vide (matchs=${fixtures.length}, classement=${rows.length})`);
  }

  return { fixtures, standings: rows };
}

export interface Ligue1SeasonMatch {
  /** Identifiant football-data.org, stable d'une synchro à l'autre. */
  id: number;
  matchday: number;
  /** Coup d'envoi, ISO UTC. */
  date: string;
  home: string;
  away: string;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

/**
 * Tous les matchs de Ligue 1 de la saison (306) en une requête : résultats des 18 clubs
 * et calendrier réel de chaque journée. Sert au modèle de prédiction et au multiplex.
 */
export async function fetchLigue1Season(token: string, seasonYear: number): Promise<Ligue1SeasonMatch[]> {
  const { matches } = await request<{ matches: FdMatch[] }>(`/competitions/${LIGUE1_CODE}/matches?season=${seasonYear}`, token);
  if (matches.length === 0) throw new Error("football-data.org : calendrier de Ligue 1 vide");
  return matches.map((m) => {
    const { home, away } = m.score.fullTime;
    const played = (m.status === "FINISHED" || m.status === "AWARDED") && home !== null && away !== null;
    return {
      id: m.id,
      matchday: m.matchday ?? 0,
      date: m.utcDate,
      home: teamName(m.homeTeam),
      away: teamName(m.awayTeam),
      played,
      ...(played ? { homeScore: home, awayScore: away } : {}),
    };
  });
}
