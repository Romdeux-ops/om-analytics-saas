import type { StandingRow } from "@/src/lib/types/standing";
import type { TeamStrength } from "./types";

/** Moyenne de buts par équipe et par match en Ligue 1 (ordre de grandeur). */
export const LEAGUE_GOALS_PER_TEAM = 1.4;

/** Nombre de matchs « fictifs » à la moyenne : évite qu'un début de saison extrême écrase tout. */
const PRIOR_MATCHES = 4;

/** Force d'une équipe estimée depuis sa ligne de classement, ou neutre à défaut. */
export function strengthFromStanding(row?: Pick<StandingRow, "played" | "goalsFor" | "goalsAgainst">): TeamStrength {
  if (!row || row.played <= 0) {
    return { attack: LEAGUE_GOALS_PER_TEAM, defense: LEAGUE_GOALS_PER_TEAM };
  }
  const prior = PRIOR_MATCHES * LEAGUE_GOALS_PER_TEAM;
  return {
    attack: (row.goalsFor + prior) / (row.played + PRIOR_MATCHES),
    defense: (row.goalsAgainst + prior) / (row.played + PRIOR_MATCHES),
  };
}

const HOME_ADVANTAGE = 1.12;
const AWAY_FACTOR = 0.9;

/** Buts attendus de chaque équipe sur 90 minutes (modèle multiplicatif attaque × défense). */
export function expectedGoals(home: TeamStrength, away: TeamStrength): { home: number; away: number } {
  return {
    home: (home.attack * away.defense / LEAGUE_GOALS_PER_TEAM) * HOME_ADVANTAGE,
    away: (away.attack * home.defense / LEAGUE_GOALS_PER_TEAM) * AWAY_FACTOR,
  };
}
