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
    status: "draw-pending",
    drawMessage:
      "Le tirage de la phase de ligue aura lieu le 28 août 2026. Les équipes seront affichées après le tirage.",
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
 * Classement pré-saison Ligue 1 : 18 équipes triées alphabétiquement, tout à 0.
 * Données 100 % statiques : calculées une seule fois au chargement du module.
 */
const LIGUE1_STANDINGS: readonly StandingRow[] = [...LIGUE1_TEAMS]
  .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
  .map((clubName, index) => ({
    rank: index + 1,
    clubName,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    isOm: isOmTeam(clubName),
  }));

export function getLigue1Standings(): readonly StandingRow[] {
  return LIGUE1_STANDINGS;
}
