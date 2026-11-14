/**
 * Schéma du JSON de paramètres produit hors ligne et injecté dans la simulation.
 * Le navigateur ne fait aucun ajustement : il lit ces valeurs et échantillonne.
 */
import type { OutcomeProbabilities, ScoreGrid } from "./grid";

export const PARAMS_SCHEMA_VERSION = 1;

/** Régression log-linéaire d'un comptage par équipe : exp(c_côté + a·log λ_propre + b·log λ_adverse). */
export interface CountModel {
  homeIntercept: number;
  awayIntercept: number;
  ownSlope: number;
  opponentSlope: number;
}

/** Fréquences d'événements mesurées sur l'historique (par équipe et par match). */
export interface EventRates {
  /** Tirs qui ne finissent pas en but. `dispersion` = paramètre k de la binomiale négative. */
  nonGoalShots: CountModel & { dispersion: number };
  /** Part des tirs non convertis qui sont cadrés. */
  onTargetShare: number;
  corners: CountModel;
  fouls: { home: number; away: number };
  /** Cartons jaunes par faute sifflée. */
  yellowPerFoul: { home: number; away: number };
  /** Part des matchs où l'équipe reçoit au moins un carton rouge. */
  redProbability: { home: number; away: number };
  /** Part des buts marqués en première période. */
  firstHalfGoalShare: number;
  /**
   * Effet d'une infériorité numérique sur le rythme de but. NON mesuré (pas de minute des cartons) :
   * valeurs de la littérature, qui ne jouent que sur le moment des buts, jamais sur leur nombre.
   */
  redCardEffect: { ownFactor: number; opponentFactor: number };
  sample: { seasons: string[]; matches: number };
}

/** Valeurs mesurées sur 2023-24 à 2025-26 (918 matchs) ; repli quand aucun JSON n'est disponible. */
export const DEFAULT_EVENT_RATES: EventRates = {
  nonGoalShots: {
    homeIntercept: 2.4245,
    awayIntercept: 2.3563,
    ownSlope: 0.2614,
    opponentSlope: -0.2614,
    dispersion: 13.46
  },
  onTargetShare: 0.2794,
  corners: {
    homeIntercept: 1.5493,
    awayIntercept: 1.5171,
    ownSlope: 0.303,
    opponentSlope: -0.303
  },
  fouls: {
    home: 12.05,
    away: 12.3
  },
  yellowPerFoul: {
    home: 0.1466,
    away: 0.1647
  },
  redProbability: {
    home: 0.1057,
    away: 0.1144
  },
  firstHalfGoalShare: 0.4396,
  redCardEffect: {
    ownFactor: 0.67,
    opponentFactor: 1.25
  },
  sample: {
    seasons: [
      "2324",
      "2425",
      "2526"
    ],
    matches: 918
  }
};

export interface TeamParams {
  /** Forces sur l'échelle log ; `def` positif = défense faible. */
  att: number;
  def: number;
  attSd: number;
  defSd: number;
  elo: number;
  /** Moyennes de l'a priori déduites de l'Elo. */
  priorAtt: number;
  priorDef: number;
  /** Club absent de la saison précédente. */
  promoted: boolean;
  /** Somme des poids temporels des matchs du club : taille d'échantillon effective. */
  effectiveMatches: number;
}

export interface FixturePrediction {
  matchday: number;
  /** Date ISO du coup d'envoi (UTC). */
  date: string;
  home: string;
  away: string;
  /** Buts attendus (moyennes de la grille prédictive). */
  lambdaHome: number;
  lambdaAway: number;
  /** Grille prédictive : moyenne sur l'incertitude des forces. C'est elle qui est affichée et échantillonnée. */
  grid: ScoreGrid;
  probabilities: OutcomeProbabilities;
  /** Estimation ponctuelle (sans incertitude), pour comparaison. */
  pointEstimate: OutcomeProbabilities;
  /** Intervalle à 90 % dû à la seule incertitude d'estimation des forces. */
  interval: { home: [number, number]; draw: [number, number]; away: [number, number] };
}

export interface PlayedFixture {
  matchday: number;
  date: string;
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
}

/** Sur le test du backtest, issues annoncées à `threshold` ou plus : probabilité moyenne annoncée et fréquence observée. */
export interface HighConfidenceCalibration {
  threshold: number;
  predicted: number;
  observed: number;
  cases: number;
}

export interface ComponentStatus {
  component: string;
  /** « démontré », « non démontré » ou « défavorable » d'après le backtest. */
  status: string;
  deltaRps: number;
  lo: number;
  hi: number;
}

export interface ModelParams {
  schemaVersion: number;
  generatedAt: string;
  /** Date du dernier match pris en compte. */
  dataThrough: string;
  matchesUsed: number;
  /** Nombre de matchs de la saison en cours pris en compte : sert à détecter de nouveaux résultats. */
  seasonResults: number;
  season: string;
  sources: { history: string; results: string; fixtures: string; elo: string };
  league: {
    mu: number;
    gamma: number;
    /** Multiplicateur des buts à domicile : exp(γ). */
    homeFactor: number;
    rho: number;
    /** Pente Elo → log-buts (pour 400 points). */
    beta: number;
    sigma: number;
    halfLifeDays: number | null;
    windowDays: number;
    elo: { k: number; homeAdvantage: number; promotedRating: number; mean: number };
  };
  teams: Record<string, TeamParams>;
  eventRates: EventRates;
  /** Journée réelle du prochain match de l'OM, ou null si le calendrier est indisponible. */
  matchday: number | null;
  /** Affiches de la journée encore à jouer : les seules à être prédites et simulées. */
  fixtures: FixturePrediction[];
  /** Affiches de la journée déjà jouées : score réel, ni prédiction ni simulation. */
  playedFixtures?: PlayedFixture[];
  /** Statut de chaque composant du modèle dans le dernier backtest. */
  components: ComponentStatus[];
  backtest: {
    generatedAt: string;
    testSeasons: string[];
    matches: number;
    rps: Record<string, number>;
    logloss: Record<string, number>;
    /** Calibration mesurée au-dessus du seuil de prudence : le modèle y a été trop confiant. */
    highConfidence?: HighConfidenceCalibration;
  } | null;
  /** Emplacement réservé : les xG ne déplacent aucune probabilité en v1. */
  xg: { used: false; source: string; matches: number; perTeam: Record<string, { for: number; against: number; matches: number }> } | null;
}

/** Prédiction d'une affiche de Ligue 1 absente de `fixtures`, à partir des forces (même calcul que hors ligne). */
export interface ClosedFormPrediction {
  grid: ScoreGrid;
  probabilities: OutcomeProbabilities;
  lambdaHome: number;
  lambdaAway: number;
}
