/**
 * Contrat entre l'interface de simulation live et un moteur de simulation.
 *
 * L'UI ne connaît que ces types : un moteur (Poisson, chaîne de Markov,
 * modèle de machine learning…) n'a qu'à implémenter `SimulationEngine`
 * pour être rejoué minute par minute dans l'interface.
 */
import type { PlayerPosition } from "@/src/lib/types/lineup";
import type { Rng } from "./rng";

export type Side = "home" | "away";

export type SimEventType =
  | "kickoff"
  | "shot"
  | "shot_on_target"
  | "save"
  | "big_chance"
  | "goal"
  | "corner"
  | "foul"
  | "offside"
  | "yellow"
  | "red"
  | "substitution"
  | "var"
  | "half_time"
  | "full_time";

/** 0 = action de jeu mineure, 1 = action notable, 2 = temps fort. */
export type EventImportance = 0 | 1 | 2;

export interface SimPlayer {
  id: string;
  name: string;
  shortName: string;
  jersey: number | null;
  position: PlayerPosition;
  seasonGoals: number;
  seasonAssists: number;
}

/**
 * Force d'une équipe exprimée en buts par match :
 * `attack` = buts marqués attendus, `defense` = buts encaissés attendus.
 */
export interface TeamStrength {
  attack: number;
  defense: number;
}

export interface SimTeam {
  /** Nom tel qu'il apparaît dans le classement (« Marseille », « Toulouse »…). */
  name: string;
  strength: TeamStrength;
  /** Vides si les compositions ne sont pas connues : les textes citent alors le club. */
  starters: SimPlayer[];
  bench: SimPlayer[];
}

export interface MatchSimulationInput {
  home: SimTeam;
  away: SimTeam;
}

export interface SimEvent {
  id: string;
  /**
   * Position sur l'axe de lecture, en minutes de jeu effectivement écoulées
   * (temps additionnel compris). 0 = coup d'envoi, `duration` = coup de sifflet final.
   */
  t: number;
  /** Minute affichée (45 ou 90 pendant le temps additionnel). */
  minute: number;
  /** Minute de temps additionnel (« 45+2' » → 2). */
  addedTime?: number;
  period: 1 | 2;
  team: Side | null;
  type: SimEventType;
  importance: EventImportance;
  playerId?: string;
  /** Passeur décisif (but), joueur qui sort (remplacement), victime (faute). */
  secondaryPlayerId?: string;
  xg?: number;
  /** Pour un événement VAR : identifiant du but contrôlé et décision. */
  varTargetId?: string;
  varOverturned?: boolean;
  text: string;
}

/** Instantané par minute de l'axe de lecture. */
export interface MinuteFrame {
  t: number;
  /** -1 = domination totale de l'extérieur, +1 = domination totale du domicile. */
  momentum: number;
  /** Part de possession du domicile sur la minute (0-100). */
  possessionHome: number;
  winProbability: { home: number; draw: number; away: number };
}

export interface SimulatedMatch {
  engineId: string;
  seed: number;
  input: MatchSimulationInput;
  events: SimEvent[];
  addedTime: { first: number; second: number };
  /** Fin de la première période sur l'axe de lecture (45 + temps additionnel). */
  halfTimeAt: number;
  /** Durée totale sur l'axe de lecture. */
  duration: number;
  /** `frames[k]` décrit la minute de lecture [k, k+1[ ; `frames[0]` = avant-match. */
  frames: MinuteFrame[];
}

export interface SimulationEngine {
  id: string;
  label: string;
  description: string;
  simulate(input: MatchSimulationInput, rng: Rng, seed: number): SimulatedMatch;
}
