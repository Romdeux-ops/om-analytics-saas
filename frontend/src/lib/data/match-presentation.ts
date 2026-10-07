import type { MatchView } from "@om/db";
import { getLigue1Standings } from "@/src/lib/data/competitions";
import { getMatchLigue1Form, type TeamFormData } from "@/src/lib/data/team-form";
import { getMatchLineups } from "@/src/lib/data/lineup";
import { getCoachForTeam, fetchLigue1CoachesFromApi, type CoachProfile } from "@/src/lib/data/coaches";
import { getMatchPreview, type MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { getUpcomingMatches } from "@/src/lib/data/matches";
import type { StandingRow } from "@/src/lib/types/standing";
import type { MatchLineups } from "@/src/lib/types/lineup";
import { resolveTeamName } from "@/src/lib/data/lineup";

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
}

export async function getMatchPresentationData(
  match: MatchView,
): Promise<MatchPresentationData> {
  const homeCanonical = resolveTeamName(match.home_team_name);
  const awayCanonical = resolveTeamName(match.away_team_name);

  // 1. Récupération concurrente de toutes les sources
  const [
    standings,
    { home: homeForm, away: awayForm },
    lineupsResult,
    upcomingMatches,
    apiCoaches,
  ] = await Promise.all([
    getLigue1Standings(),
    getMatchLigue1Form(homeCanonical, awayCanonical),
    getMatchLineups(homeCanonical, awayCanonical).catch((err) => {
      console.warn("[match-presentation] Compositions non disponibles:", err);
      return null;
    }),
    getUpcomingMatches(10),
    fetchLigue1CoachesFromApi(),
  ]);

  const homeStanding = standings.find(
    (s) => resolveTeamName(s.clubName) === homeCanonical,
  );
  const awayStanding = standings.find(
    (s) => resolveTeamName(s.clubName) === awayCanonical,
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

  // 2. Génération de la présentation éditoriale / presse
  const editorialPreview = await getMatchPreview({
    homeTeam: homeCanonical,
    awayTeam: awayCanonical,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    homeCoach,
    awayCoach,
    matchDate: new Date(match.date),
    matchday: 6,
  });

  return {
    match,
    stadium,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    homeCoach,
    awayCoach,
    lineups: lineupsResult,
    editorialPreview,
    upcomingMatches,
  };
}
