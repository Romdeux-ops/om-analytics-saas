/**
 * Contrat entre l'interface de simulation live et un moteur de simulation.
 *
 * L'UI ne connaît que ces types : un moteur (Poisson, chaîne de Markov,
 * modèle de machine learning…) n'a qu'à implémenter `SimulationEngine`
 * pour être rejoué minute par minute dans l'interface.
 */
import type { EventRates, OutcomeProbabilities } from "@om/match-model";
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
  /** Titularisations et apparitions de la saison (optionnels) : orientent les remplacements. */
  seasonStarts?: number;
  seasonAppearances?: number;
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

/** Force d'un club telle que le modèle l'estime, pour affichage. */
export interface ModelTeamInfo {
  /** Forces sur l'échelle log ; `def` positif = défense faible. */
  att: number;
  def: number;
  elo: number;
  promoted: boolean;
  /** Taille d'échantillon effective (somme des poids temporels des matchs du club). */
  effectiveMatches: number;
}

/**
 * Prédiction calibrée produite hors ligne (Dixon-Coles) et injectée dans la simulation.
 * Optionnelle : sans elle, le moteur retombe sur les forces du classement et aucune
 * probabilité ne doit être présentée comme une prédiction.
 */
export interface MatchModelInput {
  /** Grille de scores prédite, `grid[x][y]` = P(score x-y). C'est elle qui est échantillonnée. */
  grid: number[][];
  /** Buts attendus (moyennes de la grille). */
  lambdaHome: number;
  lambdaAway: number;
  /** Fréquences d'événements mesurées sur l'historique. */
  eventRates: EventRates;
  /** Ce que l'interface peut exposer : paramètres et provenance. */
  provenance: {
    /** « calendrier » : affiche du calendrier réel, intervalle disponible ; « forces » : calcul direct depuis les forces. */
    source: "calendrier" | "forces";
    generatedAt: string;
    dataThrough: string;
    matchesUsed: number;
    /** Multiplicateur des buts à domicile, estimé. */
    homeFactor: number;
    rho: number;
    home: ModelTeamInfo;
    away: ModelTeamInfo;
    /** Estimation ponctuelle (sans incertitude sur les forces). */
    pointEstimate?: OutcomeProbabilities;
    /** Intervalle à 90 % dû à l'incertitude d'estimation des forces. */
    interval?: { home: [number, number]; draw: [number, number]; away: [number, number] };
  };
}

export interface MatchSimulationInput {
  home: SimTeam;
  away: SimTeam;
  /** Prédiction calibrée (Ligue 1 uniquement). Absente : simulation illustrative, sans probabilité affichable. */
  model?: MatchModelInput;
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
