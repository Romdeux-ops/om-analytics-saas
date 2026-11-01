import type { Scoreline } from "@om/db/prediction-points";
import type { PlayerPosition } from "@/src/lib/types/lineup";

export type { Scoreline };

export type RatingWindow = "upcoming" | "open" | "closed";

export interface PredictionDistribution {
  total: number;
  homeWin: number;
  draw: number;
  awayWin: number;
  topScore: (Scoreline & { count: number }) | null;
}

export interface UserPrediction extends Scoreline {
  points: number | null;
}

export interface MatchPredictionData {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 */
  kickoff: string;
  /** Évalué côté serveur au rendu ; l'action refait la vérification. */
  isOpen: boolean;
  mine: UserPrediction | null;
  /** Vide avant le coup d'envoi : les pronos des autres restent cachés. */
  distribution: PredictionDistribution | null;
  /** Résultat réel (snapshots football), jamais le score simulé. */
  result: Scoreline | null;
}

export interface RateablePlayer {
  key: string;
  name: string;
  shortName: string;
  jersey: number | null;
  position: PlayerPosition;
  role: string | null;
  starter: boolean;
}

export interface PlayerRatingSummary {
  key: string;
  name: string;
  average: number;
  votes: number;
}

export interface MotmSummary {
  key: string;
  name: string;
  votes: number;
}

export interface MatchRatingsData {
  matchId: number;
  window: RatingWindow;
  opensAt: string;
  closesAt: string;
  teamName: string | null;
  players: RateablePlayer[];
  mine: Record<string, number>;
  myMotm: string | null;
  summary: PlayerRatingSummary[];
  motm: MotmSummary[];
}

export interface MatchCommunityData {
  prediction: MatchPredictionData;
  ratings: MatchRatingsData;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  totalPoints: number;
  exactCount: number;
  outcomeCount: number;
  scoredCount: number;
}

export interface PredictionHistoryItem {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  prediction: UserPrediction;
  result: Scoreline | null;
}

export interface MatchToRate {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: string;
  closesAt: string;
  hasVoted: boolean;
}

export interface FanSeasonRating {
  average: number;
  matchesRated: number;
  votes: number;
}
