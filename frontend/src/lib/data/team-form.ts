import { unstable_cache } from "next/cache";
import { resolveTeamName } from "@/src/lib/data/lineup";
import { shortTeamName } from "@/src/lib/ui/teams";

export type FormResultType = "V" | "N" | "D"; // Victoire, Nul, Défaite

export interface FormMatchItem {
  id: string;
  date: string;
  opponent: string;
  opponentShort: string;
  isHome: boolean;
  scoreFor: number;
  scoreAgainst: number;
  scoreFormatted: string;
  result: FormResultType;
  competition: "Ligue 1" | "Europa League" | "Coupe de France";
}

export interface TeamFormData {
  teamName: string;
  canonicalName: string;
  competition?: "ligue1" | "europa" | "coupe";
  competitionLabel?: string;
  matches: FormMatchItem[]; // Matchs récents (du plus récent au plus ancien)
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  formSequence: FormResultType[]; // ex: ['D', 'D', 'D', 'V', 'N']
}

const ESPN_TEAM_IDS: Record<string, string> = {
  Angers: "7868",
  Auxerre: "172",
  Brest: "6997",
  "Le Havre": "3236",
  "Le Mans": "2697",
  Lens: "175",
  Lille: "166",
  Lorient: "273",
  Lyon: "167",
  Marseille: "176",
  Monaco: "174",
  Nice: "2502",
  "Paris FC": "6851",
  "Paris-SG": "160",
  Rennes: "169",
  Strasbourg: "180",
  Toulouse: "179",
  Troyes: "170",
};

const ESPN_EUROPA_TEAM_IDS: Record<string, string> = {
  Marseille: "176",
  Olympiacos: "435",
  "Beşiktaş": "1895",
  "Sturm Graz": "3746",
  Leverkusen: "131",
  "Levski Sofia": "490",
  Celta: "85",
  Celtic: "256",
  Anderlecht: "441",
};

/**
 * Données de secours fiables Ligue 1 (J1 à J5 de la saison 2026-2027)
 * Garantit que la présentation fonctionne instantanément même hors-ligne.
 */
const FALLBACK_LIGUE1_FORM: Record<string, FormMatchItem[]> = {
  Marseille: [
    {
      id: "om-l1-j5",
      date: "2026-09-20T20:45:00+02:00",
      opponent: "Paris-SG",
      opponentShort: "Paris-SG",
      isHome: true,
      scoreFor: 1,
      scoreAgainst: 2,
      scoreFormatted: "1 - 2",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "om-l1-j4",
      date: "2026-09-11T20:45:00+02:00",
      opponent: "Rennes",
      opponentShort: "Rennes",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 1,
      scoreFormatted: "0 - 1",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "om-l1-j3",
      date: "2026-09-06T20:45:00+02:00",
      opponent: "Paris FC",
      opponentShort: "Paris FC",
      isHome: true,
      scoreFor: 2,
      scoreAgainst: 3,
      scoreFormatted: "2 - 3",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "om-l1-j2",
      date: "2026-08-30T20:45:00+02:00",
      opponent: "Monaco",
      opponentShort: "Monaco",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 2,
      scoreFormatted: "0 - 2",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "om-l1-j1",
      date: "2026-08-21T20:45:00+02:00",
      opponent: "Strasbourg",
      opponentShort: "Strasbourg",
      isHome: true,
      scoreFor: 4,
      scoreAgainst: 0,
      scoreFormatted: "4 - 0",
      result: "V",
      competition: "Ligue 1",
    },
  ],
  Troyes: [
    {
      id: "estac-l1-j5",
      date: "2026-09-19T18:45:00+02:00",
      opponent: "Angers",
      opponentShort: "Angers",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 2,
      scoreFormatted: "0 - 2",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "estac-l1-j4",
      date: "2026-09-13T13:00:00+02:00",
      opponent: "Lille",
      opponentShort: "Lille",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 2,
      scoreFormatted: "0 - 2",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "estac-l1-j3",
      date: "2026-09-06T13:00:00+02:00",
      opponent: "Strasbourg",
      opponentShort: "Strasbourg",
      isHome: true,
      scoreFor: 2,
      scoreAgainst: 6,
      scoreFormatted: "2 - 6",
      result: "D",
      competition: "Ligue 1",
    },
    {
      id: "estac-l1-j2",
      date: "2026-08-29T18:45:00+02:00",
      opponent: "Lorient",
      opponentShort: "Lorient",
      isHome: false,
      scoreFor: 2,
      scoreAgainst: 1,
      scoreFormatted: "2 - 1",
      result: "V",
      competition: "Ligue 1",
    },
    {
      id: "estac-l1-j1",
      date: "2026-08-22T18:45:00+02:00",
      opponent: "Paris FC",
      opponentShort: "Paris FC",
      isHome: true,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreFormatted: "0 - 0",
      result: "N",
      competition: "Ligue 1",
    },
  ],
};

function calculateAggregates(
  teamName: string,
  canonicalName: string,
  matches: FormMatchItem[],
): TeamFormData {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  for (const m of matches) {
    if (m.result === "V") wins++;
    else if (m.result === "N") draws++;
    else losses++;
    goalsFor += m.scoreFor;
    goalsAgainst += m.scoreAgainst;
  }

  const points = wins * 3 + draws;
  const goalDiff = goalsFor - goalsAgainst;
  const formSequence = matches.map((m) => m.result);

  return {
    teamName,
    canonicalName,
    matches,
    wins,
    draws,
    losses,
    points,
    goalsFor,
    goalsAgainst,
    goalDiff,
    formSequence,
  };
}

/**
 * Récupère les 5 derniers matchs de Ligue 1 uniquement pour un club donné.
 */
export async function getTeamLigue1Form(teamName: string): Promise<TeamFormData> {
  const canonicalName = resolveTeamName(teamName);
  const espnId = ESPN_TEAM_IDS[canonicalName];

  if (!espnId) {
    const fallback = FALLBACK_LIGUE1_FORM[canonicalName] ?? [];
    return calculateAggregates(teamName, canonicalName, fallback);
  }

  return unstable_cache(
    async () => {
      try {
        const url = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/fra.1/teams/${espnId}/schedule`;
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        });

        if (!res.ok) {
          throw new Error(`ESPN schedule error: HTTP ${res.status}`);
        }

        const data = await res.json();
        const events = data.events ?? [];

        // Filtrer uniquement les matchs terminés de Ligue 1
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const completed = events.filter((e: any) => {
          const comp = e.competitions?.[0];
          return comp?.status?.type?.completed === true;
        });

        // Trier par date décroissante pour avoir les plus récents en premier
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        completed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Prendre les 5 derniers matchs
        const last5 = completed.slice(0, 5);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const parsedMatches: FormMatchItem[] = last5.map((event: any) => {
          const comp = event.competitions?.[0];
          const competitors = comp?.competitors ?? [];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const thisTeam = competitors.find((c: any) => String(c.team?.id) === espnId);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const oppTeam = competitors.find((c: any) => String(c.team?.id) !== espnId);

          const isHome = thisTeam?.homeAway === "home";
          const rawScoreFor = thisTeam?.score?.value ?? thisTeam?.score ?? 0;
          const rawScoreOpp = oppTeam?.score?.value ?? oppTeam?.score ?? 0;

          const scoreFor = Number(rawScoreFor) || 0;
          const scoreAgainst = Number(rawScoreOpp) || 0;

          let result: FormResultType = "N";
          if (scoreFor > scoreAgainst) result = "V";
          else if (scoreFor < scoreAgainst) result = "D";

          const oppName = oppTeam?.team?.displayName ?? "Adversaire";

          return {
            id: String(event.id || `${espnId}-${event.date}`),
            date: event.date,
            opponent: oppName,
            opponentShort: shortTeamName(oppName),
            isHome,
            scoreFor,
            scoreAgainst,
            scoreFormatted: isHome ? `${scoreFor} - ${scoreAgainst}` : `${scoreAgainst} - ${scoreFor}`,
            result,
            competition: "Ligue 1" as const,
          };
        });

        if (parsedMatches.length > 0) {
          return calculateAggregates(teamName, canonicalName, parsedMatches);
        }
      } catch (err) {
        console.warn(`[team-form] Impossible de charger la forme ESPN pour ${teamName}, repli local:`, err);
      }

      // Repli sur données locales
      const fallback = FALLBACK_LIGUE1_FORM[canonicalName] ?? [];
      return calculateAggregates(teamName, canonicalName, fallback);
    },
    [`team-form-l1-${canonicalName}`],
    { revalidate: 3600, tags: ["team-form"] },
  )();
}

const FALLBACK_EUROPA_FORM: Record<string, FormMatchItem[]> = {
  Marseille: [
    {
      id: "om-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Beşiktaş",
      opponentShort: "Beşiktaş",
      isHome: false,
      scoreFor: 1,
      scoreAgainst: 4,
      scoreFormatted: "1 - 4",
      result: "D",
      competition: "Europa League",
    },
  ],
  Olympiacos: [
    {
      id: "oly-el-j1",
      date: "2026-09-16T21:00:00+02:00",
      opponent: "Jagiellonia Białystok",
      opponentShort: "Jagiellonia",
      isHome: true,
      scoreFor: 2,
      scoreAgainst: 1,
      scoreFormatted: "2 - 1",
      result: "V",
      competition: "Europa League",
    },
  ],
  "Beşiktaş": [
    {
      id: "bes-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Marseille",
      opponentShort: "Marseille",
      isHome: true,
      scoreFor: 4,
      scoreAgainst: 1,
      scoreFormatted: "4 - 1",
      result: "V",
      competition: "Europa League",
    },
  ],
  "Sturm Graz": [
    {
      id: "stu-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Dinamo Zagreb",
      opponentShort: "Dinamo Zagreb",
      isHome: true,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreFormatted: "0 - 0",
      result: "N",
      competition: "Europa League",
    },
  ],
  Leverkusen: [
    {
      id: "lev-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Celta",
      opponentShort: "Celta",
      isHome: true,
      scoreFor: 2,
      scoreAgainst: 0,
      scoreFormatted: "2 - 0",
      result: "V",
      competition: "Europa League",
    },
  ],
  "Levski Sofia": [
    {
      id: "levs-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Anderlecht",
      opponentShort: "Anderlecht",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 1,
      scoreFormatted: "0 - 1",
      result: "D",
      competition: "Europa League",
    },
  ],
  Celta: [
    {
      id: "cel-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Leverkusen",
      opponentShort: "Leverkusen",
      isHome: false,
      scoreFor: 0,
      scoreAgainst: 2,
      scoreFormatted: "0 - 2",
      result: "D",
      competition: "Europa League",
    },
  ],
  Celtic: [
    {
      id: "celt-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Milan",
      opponentShort: "Milan",
      isHome: true,
      scoreFor: 1,
      scoreAgainst: 3,
      scoreFormatted: "1 - 3",
      result: "D",
      competition: "Europa League",
    },
  ],
  Anderlecht: [
    {
      id: "and-el-j1",
      date: "2026-09-17T21:00:00+02:00",
      opponent: "Levski Sofia",
      opponentShort: "Levski Sofia",
      isHome: true,
      scoreFor: 1,
      scoreAgainst: 0,
      scoreFormatted: "1 - 0",
      result: "V",
      competition: "Europa League",
    },
  ],
};

/**
 * Récupère les matchs d'Europa League (phase de ligue) pour un club donné.
 */
export async function getTeamEuropaForm(teamName: string): Promise<TeamFormData> {
  const canonicalName = resolveTeamName(teamName);
  const espnId = ESPN_EUROPA_TEAM_IDS[canonicalName];

  return unstable_cache(
    async () => {
      if (espnId) {
        try {
          const url = `https://site.web.api.espn.com/apis/site/v2/sports/soccer/uefa.europa/teams/${espnId}/schedule`;
          const res = await fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
          });

          if (res.ok) {
            const data = await res.json();
            const events = data.events ?? [];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const completed = events.filter((e: any) => e.competitions?.[0]?.status?.type?.completed === true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            completed.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const parsedMatches: FormMatchItem[] = completed.map((event: any) => {
              const comp = event.competitions?.[0];
              const competitors = comp?.competitors ?? [];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const thisTeam = competitors.find((c: any) => String(c.team?.id) === espnId);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const oppTeam = competitors.find((c: any) => String(c.team?.id) !== espnId);

              const isHome = thisTeam?.homeAway === "home";
              const scoreFor = Number(thisTeam?.score?.value ?? thisTeam?.score ?? 0);
              const scoreAgainst = Number(oppTeam?.score?.value ?? oppTeam?.score ?? 0);

              let result: FormResultType = "N";
              if (scoreFor > scoreAgainst) result = "V";
              else if (scoreFor < scoreAgainst) result = "D";

              const oppName = oppTeam?.team?.displayName ?? "Adversaire";

              return {
                id: String(event.id || `${espnId}-${event.date}`),
                date: event.date,
                opponent: oppName,
                opponentShort: shortTeamName(oppName),
                isHome,
                scoreFor,
                scoreAgainst,
                scoreFormatted: isHome ? `${scoreFor} - ${scoreAgainst}` : `${scoreAgainst} - ${scoreFor}`,
                result,
                competition: "Europa League" as const,
              };
            });

            if (parsedMatches.length > 0) {
              const agg = calculateAggregates(teamName, canonicalName, parsedMatches);
              const result: TeamFormData = {
                ...agg,
                competition: "europa",
                competitionLabel: "Europa League",
              };
              return result;
            }
          }
        } catch (err) {
          console.warn(`[team-form] Impossible de charger la forme ESPN Europa pour ${teamName}, repli local:`, err);
        }
      }

      const fallback = FALLBACK_EUROPA_FORM[canonicalName] ?? [];
      const agg = calculateAggregates(teamName, canonicalName, fallback);
      const result: TeamFormData = {
        ...agg,
        competition: "europa",
        competitionLabel: "Europa League",
      };
      return result;
    },
    [`team-form-el-${canonicalName}`],
    { revalidate: 3600, tags: ["team-form"] },
  )();
}

/**
 * Récupère en parallèle la forme des deux équipes d'un match (Ligue 1 uniquement).
 */
export async function getMatchLigue1Form(
  homeTeam: string,
  awayTeam: string,
): Promise<{ home: TeamFormData; away: TeamFormData }> {
  const [home, away] = await Promise.all([
    getTeamLigue1Form(homeTeam),
    getTeamLigue1Form(awayTeam),
  ]);
  return { home, away };
}

/**
 * Récupère en parallèle la forme des deux équipes d'un match (Europa League).
 */
export async function getMatchEuropaForm(
  homeTeam: string,
  awayTeam: string,
): Promise<{ home: TeamFormData; away: TeamFormData }> {
  const [home, away] = await Promise.all([
    getTeamEuropaForm(homeTeam),
    getTeamEuropaForm(awayTeam),
  ]);
  return { home, away };
}

/**
 * Récupère la forme selon la compétition du match.
 */
export async function getMatchForm(
  homeTeam: string,
  awayTeam: string,
  competition: "ligue1" | "europa" | "coupe" = "ligue1",
): Promise<{ home: TeamFormData; away: TeamFormData }> {
  if (competition === "europa") {
    return getMatchEuropaForm(homeTeam, awayTeam);
  }
  return getMatchLigue1Form(homeTeam, awayTeam);
}
