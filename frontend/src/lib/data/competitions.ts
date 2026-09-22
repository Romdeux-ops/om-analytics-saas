import type { Competition } from "@/src/lib/types/competition";
import type { StandingRow } from "@/src/lib/types/standing";
import { isOmTeam } from "@/src/lib/ui/teams";

/** 18 clubs de Ligue 1 — saison 2026-2027 */
export const LIGUE1_TEAMS = [
  "Angers",
  "Auxerre",
  "Brest",
  "Le Havre",
  "Le Mans",
  "Lens",
  "Lille",
  "Lorient",
  "Lyon",
  "Marseille",
  "Monaco",
  "Nice",
  "Paris FC",
  "Paris-SG",
  "Rennes",
  "Strasbourg",
  "Toulouse",
  "Troyes",
] as const;

export const COMPETITIONS: Competition[] = [
  {
    id: "ligue1",
    label: "Ligue 1",
    shortLabel: "L1",
    season: "2026-2027",
    status: "active",
  },
  {
    id: "europa",
    label: "Europa League",
    shortLabel: "EL",
    season: "2026-2027",
    status: "active",
  },
  {
    id: "coupe",
    label: "Coupe de France",
    shortLabel: "CDF",
    season: "2026-2027",
    status: "draw-pending",
    drawMessage: "Le tirage sera communiqué prochainement.",
  },
];

export function getCompetition(id: Competition["id"]): Competition {
  const comp = COMPETITIONS.find((c) => c.id === id);
  if (!comp) throw new Error(`Competition inconnue: ${id}`);
  return comp;
}

/**
 * Classement Ligue 1 après la journée 5 (2026-2027).
 * Zones : C1 (1-2), Europa League (4), Conference League (5), relégation (16-18).
 * L'ordre du tableau fait foi pour le classement (départage des égalités déjà appliqué) ;
 * le rang affiché est recalculé depuis la position pour garantir un numéro unique par club.
 */
const LIGUE1_STANDINGS_RAW: Omit<StandingRow, "isOm" | "rank">[] = [
  { clubName: "Monaco", played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 8, goalsAgainst: 3, points: 13, zone: "champions-league" },
  { clubName: "Lyon", played: 5, won: 3, drawn: 2, lost: 0, goalsFor: 10, goalsAgainst: 2, points: 11, zone: "champions-league" },
  { clubName: "Paris FC", played: 5, won: 3, drawn: 2, lost: 0, goalsFor: 8, goalsAgainst: 3, points: 11 },
  { clubName: "Lille", played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 8, goalsAgainst: 4, points: 10, zone: "europa-league" },
  { clubName: "Rennes", played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 8, goalsAgainst: 9, points: 10, zone: "conference-league" },
  { clubName: "Paris-SG", played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 7, points: 8 },
  { clubName: "Angers", played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 6, goalsAgainst: 5, points: 7 },
  { clubName: "Strasbourg", played: 5, won: 2, drawn: 1, lost: 2, goalsFor: 10, goalsAgainst: 10, points: 7 },
  { clubName: "Le Mans", played: 5, won: 1, drawn: 3, lost: 1, goalsFor: 9, goalsAgainst: 9, points: 6 },
  { clubName: "Auxerre", played: 5, won: 2, drawn: 0, lost: 3, goalsFor: 7, goalsAgainst: 12, points: 6 },
  { clubName: "Brest", played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 7, goalsAgainst: 8, points: 5 },
  { clubName: "Lorient", played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 5, goalsAgainst: 6, points: 5 },
  { clubName: "Toulouse", played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 7, goalsAgainst: 9, points: 5 },
  { clubName: "Nice", played: 5, won: 1, drawn: 2, lost: 2, goalsFor: 3, goalsAgainst: 6, points: 5 },
  { clubName: "Lens", played: 5, won: 1, drawn: 1, lost: 3, goalsFor: 9, goalsAgainst: 9, points: 4 },
  { clubName: "Troyes", played: 5, won: 1, drawn: 1, lost: 3, goalsFor: 4, goalsAgainst: 11, points: 4, zone: "relegation" },
  { clubName: "Marseille", played: 5, won: 1, drawn: 0, lost: 4, goalsFor: 7, goalsAgainst: 8, points: 3, zone: "relegation" },
  { clubName: "Le Havre", played: 5, won: 0, drawn: 2, lost: 3, goalsFor: 4, goalsAgainst: 7, points: 2, zone: "relegation" },
];

const LIGUE1_STANDINGS: readonly StandingRow[] = LIGUE1_STANDINGS_RAW.map((row, index) => ({
  ...row,
  rank: index + 1,
  isOm: isOmTeam(row.clubName),
}));

export function getLigue1Standings(): readonly StandingRow[] {
  return LIGUE1_STANDINGS;
}

/**
 * Classement Europa League — phase de ligue, journée 1 (2026-2027).
 * Nouveau format UEFA : top 8 qualifiés directs (8es), 9-24 barrages, 25-36 éliminés.
 * Ordre déjà départagé (source officielle) ; le rang affiché = position dans le tableau,
 * pour qu'aucun club à égalité de points ne partage le même numéro.
 */
const EUROPA_STANDINGS_RAW: Omit<StandingRow, "isOm" | "rank">[] = [
  { clubName: "Juventus", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 5, goalsAgainst: 0, points: 3, zone: "playoffs-direct" },
  { clubName: "Palace", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 0, points: 3, zone: "playoffs-direct" },
  { clubName: "Sparta Praha", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, points: 3, zone: "playoffs-direct" },
  { clubName: "Beşiktaş", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 4, goalsAgainst: 1, points: 3, zone: "playoffs-direct" },
  { clubName: "Union", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 0, points: 3, zone: "playoffs-direct" },
  { clubName: "Ferencváros", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, points: 3, zone: "playoffs-direct" },
  { clubName: "Benfica", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, zone: "playoffs-direct" },
  { clubName: "OFI", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Leverkusen", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, points: 3, zone: "playoffs-direct" },
  { clubName: "Torreense", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Lyon", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Bournemouth", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Olympiacos", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 1, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "RB Salzburg", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Omonoia", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Sunderland", played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 1, goalsAgainst: 0, points: 3, zone: "playoffs-qualifiers" },
  { clubName: "Rennes", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 1, zone: "playoffs-qualifiers" },
  { clubName: "H. Beer-Sheva", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 1, zone: "playoffs-qualifiers" },
  { clubName: "Dinamo Zagreb", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 1, zone: "playoffs-qualifiers" },
  { clubName: "Sturm Graz", played: 1, won: 0, drawn: 1, lost: 0, goalsFor: 0, goalsAgainst: 0, points: 1, zone: "playoffs-qualifiers" },
  { clubName: "Jagiellonia Białystok", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, zone: "playoffs-qualifiers" },
  { clubName: "Lillestrøm", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, zone: "playoffs-qualifiers" },
  { clubName: "Sociedad", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, zone: "playoffs-qualifiers" },
  { clubName: "Anderlecht", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 2, points: 0, zone: "playoffs-qualifiers" },
  { clubName: "Levski Sofia", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, points: 0 },
  { clubName: "AZ Alkmaar", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, points: 0 },
  { clubName: "Celta", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 1, points: 0 },
  { clubName: "Celtic", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, points: 0 },
  { clubName: "Hoffenheim", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0 },
  { clubName: "Milan", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0 },
  { clubName: "Celje", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, points: 0 },
  { clubName: "Marseille", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 4, points: 0 },
  { clubName: "Ararat-Armenia", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 4, points: 0 },
  { clubName: "Viktoria Plzeň", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 3, points: 0 },
  { clubName: "Lech Poznań", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 4, points: 0 },
  { clubName: "NEC", played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 5, points: 0 },
];

const EUROPA_STANDINGS: readonly StandingRow[] = EUROPA_STANDINGS_RAW.map((row, index) => ({
  ...row,
  rank: index + 1,
  isOm: isOmTeam(row.clubName),
}));

export function getEuropaStandings(): readonly StandingRow[] {
  return EUROPA_STANDINGS;
}
