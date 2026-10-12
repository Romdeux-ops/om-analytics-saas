import type { MatchView } from "@om/db";
import { getLigue1Standings, getEuropaStandings } from "@/src/lib/data/competitions";
import { getMatchForm, type TeamFormData } from "@/src/lib/data/team-form";
import { getMatchLineups } from "@/src/lib/data/lineup";
import { getCoachForTeam, fetchLigue1CoachesFromApi, type CoachProfile } from "@/src/lib/data/coaches";
import { getMatchPreview, type MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { getUpcomingMatches } from "@/src/lib/data/matches";
import type { StandingRow } from "@/src/lib/types/standing";
import type { MatchLineups } from "@/src/lib/types/lineup";
import { resolveTeamName } from "@/src/lib/data/lineup";

export type CompetitionId = "ligue1" | "europa" | "coupe";

export interface StadiumInfo {
  name: string;
  city: string;
  capacity?: string;
}

const STADIUMS: Record<string, StadiumInfo> = {
  Troyes: { name: "Stade de l'Aube", city: "Troyes", capacity: "20 400 places" },
  Marseille: { name: "Orange Vélodrome", city: "Marseille", capacity: "67 394 places" },
  "Paris-SG": { name: "Parc des Princes", city: "Paris", capacity: "48 583 places" },
  Monaco: { name: "Stade Louis-II", city: "Monaco", capacity: "18 523 places" },
  Lyon: { name: "Groupama Stadium", city: "Décines-Charpieu", capacity: "59 186 places" },
  Lille: { name: "Decathlon Arena - Stade Pierre-Mauroy", city: "Villeneuve-d'Ascq", capacity: "50 186 places" },
  Lens: { name: "Stade Bollaert-Delelis", city: "Lens", capacity: "38 223 places" },
  Rennes: { name: "Roazhon Park", city: "Rennes", capacity: "29 778 places" },
  Nice: { name: "Allianz Riviera", city: "Nice", capacity: "36 178 places" },
  Brest: { name: "Stade Francis-Le Blé", city: "Brest", capacity: "15 220 places" },
  Strasbourg: { name: "Stade de la Meinau", city: "Strasbourg", capacity: "26 109 places" },
  Toulouse: { name: "Stadium de Toulouse", city: "Toulouse", capacity: "33 150 places" },
  Auxerre: { name: "Stade de l'Abbé-Deschamps", city: "Auxerre", capacity: "18 541 places" },
  Angers: { name: "Stade Raymond-Kopa", city: "Angers", capacity: "18 752 places" },
  "Le Havre": { name: "Stade Océane", city: "Le Havre", capacity: "25 178 places" },
  Lorient: { name: "Stade du Moustoir", city: "Lorient", capacity: "18 110 places" },
  "Paris FC": { name: "Stade Charléty", city: "Paris", capacity: "20 000 places" },
  "Le Mans": { name: "Stade Marie-Marvingt", city: "Le Mans", capacity: "25 064 places" },
  // Europa League
  Olympiacos: { name: "Stade Georgios Karaïskákis", city: "Le Pirée", capacity: "32 115 places" },
  "Beşiktaş": { name: "Tüpraş Stadyumu", city: "Istanbul", capacity: "42 590 places" },
  "Sturm Graz": { name: "Merkur Arena", city: "Graz", capacity: "16 364 places" },
  Leverkusen: { name: "BayArena", city: "Leverkusen", capacity: "30 210 places" },
  "Levski Sofia": { name: "Stade Georgi Asparuhov", city: "Sofia", capacity: "25 000 places" },
  Celta: { name: "Stade de Balaídos", city: "Vigo", capacity: "29 000 places" },
  Celtic: { name: "Celtic Park", city: "Glasgow", capacity: "60 411 places" },
  Anderlecht: { name: "Lotto Park", city: "Bruxelles", capacity: "21 500 places" },
};

export function getStadiumInfo(homeTeam: string): StadiumInfo {
  const canonical = resolveTeamName(homeTeam);
  return STADIUMS[canonical] ?? {
    name: `Stade de ${homeTeam}`,
    city: homeTeam,
  };
}

export interface MatchPresentationData {
  match: MatchView;
  competition: CompetitionId;
  competitionLabel: string;
  matchday: number;
  stadium: StadiumInfo;
  homeStanding?: StandingRow;
  awayStanding?: StandingRow;
  homeForm: TeamFormData;
  awayForm: TeamFormData;
  homeCoach: CoachProfile;
  awayCoach: CoachProfile;
  lineups: MatchLineups | null;
  editorialPreview: MatchEditorialPreview;
  upcomingMatches: MatchView[];
  isNextMatch: boolean;
  nextMatchId?: number;
}

const EUROPA_TEAMS = new Set([
  "Olympiacos",
  "Beşiktaş",
  "Sturm Graz",
  "Leverkusen",
  "Levski Sofia",
  "Celta",
  "Celtic",
  "Anderlecht",
]);

export async function getMatchPresentationData(
  match: MatchView,
): Promise<MatchPresentationData> {
  const homeCanonical = resolveTeamName(match.home_team_name);
  const awayCanonical = resolveTeamName(match.away_team_name);
  const db = (await import("@/src/lib/db")).getDb();
  const { getMatchCustomization, getNextOmMatch, getFirstUnplayedMatch } = await import("@om/db");

  // Détection de la compétition
  const isEuropa = EUROPA_TEAMS.has(homeCanonical) || EUROPA_TEAMS.has(awayCanonical);
  const competition: CompetitionId = isEuropa ? "europa" : "ligue1";
  const competitionLabel = isEuropa ? "Europa League" : "Ligue 1";

  // Déterminer la journée de compétition
  let matchday = isEuropa ? 2 : 6;
  try {
    const { getAllOmFixtures } = await import("@/src/lib/data/calendar");
    const allFixtures = await getAllOmFixtures();
    const matchTime = new Date(match.date).getTime();
    const foundFixture = allFixtures.find(
      (f) =>
        f.competition === competition &&
        ((resolveTeamName(f.homeTeam) === homeCanonical && resolveTeamName(f.awayTeam) === awayCanonical) ||
          Math.abs(new Date(f.date).getTime() - matchTime) < 48 * 3600 * 1000),
    );
    if (foundFixture) {
      matchday = foundFixture.matchday;
    }
  } catch {
    // Garde le matchday par défaut
  }

  // 1. Récupération concurrente de toutes les sources selon la compétition
  const [
    standings,
    { home: homeForm, away: awayForm },
    lineupsResult,
    upcomingMatches,
    apiCoaches,
    customization,
    nextUnplayedMatch,
  ] = await Promise.all([
    isEuropa ? getEuropaStandings() : getLigue1Standings(),
    getMatchForm(homeCanonical, awayCanonical, competition),
    getMatchLineups(homeCanonical, awayCanonical).catch((err) => {
      console.warn("[match-presentation] Compositions non disponibles:", err);
      return null;
    }),
    getUpcomingMatches(10),
    fetchLigue1CoachesFromApi(),
    getMatchCustomization(db, match.id).catch(() => null),
    (async () => {
      try {
        return (await getNextOmMatch(db)) ?? (await getFirstUnplayedMatch(db));
      } catch {
        return null;
      }
    })(),
  ]);

  const homeStanding = standings.find(
    (s) => resolveTeamName(s.clubName) === homeCanonical || s.clubName.toLowerCase() === homeCanonical.toLowerCase(),
  );
  const awayStanding = standings.find(
    (s) => resolveTeamName(s.clubName) === awayCanonical || s.clubName.toLowerCase() === awayCanonical.toLowerCase(),
  );

  const homeCoach = getCoachForTeam(
    homeCanonical,
    match.home_coach,
    apiCoaches[homeCanonical] || apiCoaches[match.home_team_name],
  );
  const awayCoach = getCoachForTeam(
    awayCanonical,
    match.away_coach,
    apiCoaches[awayCanonical] || apiCoaches[match.away_team_name],
  );

  const stadium = getStadiumInfo(homeCanonical);

  // 2. Génération de la présentation éditoriale / presse adaptée à la compétition
  const baseEditorial = await getMatchPreview({
    homeTeam: homeCanonical,
    awayTeam: awayCanonical,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    homeCoach,
    awayCoach,
    matchDate: new Date(match.date),
    matchday,
    competition,
  });

  // 3. Fusion des personnalisations staff/admin sauvegardées
  let finalLineups = lineupsResult;
  if (customization?.customLineup && finalLineups) {
    const custom = customization.customLineup as Partial<MatchLineups>;
    finalLineups = {
      ...finalLineups,
      home: custom.home ?? finalLineups.home,
      away: custom.away ?? finalLineups.away,
    };
  }

  let finalEditorial = baseEditorial;
  if (customization?.customEditorial) {
    const custom = customization.customEditorial as Partial<MatchEditorialPreview>;
    finalEditorial = {
      ...baseEditorial,
      ...custom,
      isCustomized: true,
      customizedAt: customization.updatedAt ? new Date(customization.updatedAt).toISOString() : undefined,
    };
  }

  const isNextMatch = nextUnplayedMatch ? nextUnplayedMatch.id === match.id : true;

  return {
    match,
    competition,
    competitionLabel,
    matchday,
    stadium,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    homeCoach,
    awayCoach,
    lineups: finalLineups,
    editorialPreview: finalEditorial,
    upcomingMatches,
    isNextMatch,
    nextMatchId: nextUnplayedMatch?.id,
  };
}
