import type {
  FootballCompetitionId,
  SnapshotFixture,
  SnapshotStanding,
  SnapshotStandingZone,
} from "@om/db";
import { toParisIso } from "./dates";
import { canonicalTeamName } from "./teams";

/**
 * API JSON publique (non officielle, sans clé) utilisée par espn.com.
 * L'hôte site.api.espn.com répond 403 hors navigateur : site.web.api.espn.com fonctionne.
 */
const BASE_URL = "https://site.web.api.espn.com/apis";
const OM_ESPN_ID = "176";

export const ESPN_LEAGUES = {
  europa: "uefa.europa",
  coupe: "fra.coupe_de_france",
} as const;

interface EspnTeam {
  displayName: string;
  shortDisplayName?: string;
}

interface EspnCompetitor {
  homeAway: "home" | "away";
  team: EspnTeam;
  score?: { value?: number | null } | string | null;
}

interface EspnEvent {
  id: string;
  date: string;
  seasonType?: { id: string };
  competitions: {
    timeValid?: boolean;
    status: { type: { completed: boolean } };
    competitors: EspnCompetitor[];
  }[];
}

interface EspnSchedule {
  season?: { year: number };
  events?: EspnEvent[];
}

interface EspnStandingEntry {
  team: EspnTeam;
  note?: { description?: string };
  stats: { name: string; value?: number | null }[];
}

interface EspnStandings {
  children?: { standings: { season?: number; entries: EspnStandingEntry[] } }[];
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN ${path} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

function scoreOf(competitor: EspnCompetitor): number | null {
  const { score } = competitor;
  if (score == null) return null;
  const value = typeof score === "string" ? Number(score) : score.value;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

const teamName = (team: EspnTeam) => canonicalTeamName(team.displayName, team.shortDisplayName);

/** Matchs de l'OM (résultats + à venir) d'une compétition, pour la saison demandée uniquement. */
export async function fetchEspnFixtures(
  competition: Exclude<FootballCompetitionId, "ligue1">,
  seasonYear: number,
): Promise<SnapshotFixture[]> {
  const path = `/site/v2/sports/soccer/${ESPN_LEAGUES[competition]}/teams/${OM_ESPN_ID}/schedule?season=${seasonYear}`;
  const schedules = await Promise.all([
    request<EspnSchedule>(path),
    request<EspnSchedule>(`${path}&fixture=true`),
  ]);

  const events = new Map<string, EspnEvent>();
  for (const schedule of schedules) {
    // ESPN renvoie la saison précédente tant que la nouvelle n'est pas ouverte (ex. Coupe de France).
    if (schedule.season?.year !== seasonYear) continue;
    for (const event of schedule.events ?? []) events.set(event.id, event);
  }

  // ESPN ne fournit pas de numéro de journée : on numérote chronologiquement par phase.
  const matchdayByPhase = new Map<string, number>();

  return [...events.values()]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .flatMap((event): SnapshotFixture[] => {
      const comp = event.competitions[0];
      const home = comp?.competitors.find((c) => c.homeAway === "home");
      const away = comp?.competitors.find((c) => c.homeAway === "away");
      if (!comp || !home || !away) return [];

      const phase = event.seasonType?.id ?? "default";
      const matchday = (matchdayByPhase.get(phase) ?? 0) + 1;
      matchdayByPhase.set(phase, matchday);

      const homeScore = scoreOf(home);
      const awayScore = scoreOf(away);
      const played = comp.status.type.completed && homeScore !== null && awayScore !== null;

      return [
        {
          competition,
          matchday,
          homeTeam: teamName(home.team),
          awayTeam: teamName(away.team),
          date: toParisIso(event.date),
          timeTbd: comp.timeValid === false,
          played,
          ...(played ? { homeScore: homeScore!, awayScore: awayScore! } : {}),
        },
      ];
    });
}

/** Phase de ligue UEFA : top 8 → 8es directs, 9-24 → barrages, 25-36 → éliminés. */
export function europaZone(entry: EspnStandingEntry): SnapshotStandingZone | undefined {
  const note = entry.note?.description?.toLowerCase() ?? "";
  if (note.includes("round of 16")) return "playoffs-direct";
  if (note.includes("playoff")) return "playoffs-qualifiers";
  return undefined;
}

export async function fetchEspnStandings(
  competition: Exclude<FootballCompetitionId, "ligue1">,
  seasonYear: number,
  zoneOf: (entry: EspnStandingEntry) => SnapshotStandingZone | undefined,
): Promise<SnapshotStanding[]> {
  const data = await request<EspnStandings>(
    `/v2/sports/soccer/${ESPN_LEAGUES[competition]}/standings?season=${seasonYear}`,
  );
  const table = data.children?.[0]?.standings;
  if (!table || (table.season !== undefined && table.season !== seasonYear)) return [];

  return table.entries
    .map((entry, index) => {
      const stat = (name: string) => entry.stats.find((s) => s.name === name)?.value ?? 0;
      return {
        rank: stat("rank") || index + 1,
        clubName: teamName(entry.team),
        played: stat("gamesPlayed"),
        won: stat("wins"),
        drawn: stat("ties"),
        lost: stat("losses"),
        goalsFor: stat("pointsFor"),
        goalsAgainst: stat("pointsAgainst"),
        points: stat("points"),
        zone: zoneOf(entry),
      };
    })
    .sort((a, b) => a.rank - b.rank);
}
