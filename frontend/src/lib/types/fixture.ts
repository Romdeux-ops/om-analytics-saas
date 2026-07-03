import type { CompetitionId } from "@/src/lib/types/competition";

export interface CalendarFixture {
  /** Compétition à laquelle appartient le match */
  competition: CompetitionId;
  /** Numéro de journée / tour (0 si non pertinent) */
  matchday: number;
  /** Nom canonique aligné sur competitions.ts / teams.ts */
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 avec offset Europe/Paris */
  date: string;
  /** Horaire non confirmé — affiche la date seule */
  timeTbd: boolean;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  /** Prévu pour la future couche simulation */
  isSimulated?: boolean;
}
