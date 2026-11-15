/** Assemblage Elo → a priori → ajustement, partagé par le backtest et la génération des paramètres. */
import { runElo, type EloConfig, type EloRun } from "./elo";
import type { FitConfig, FitMatch, FitPrior } from "./fit";
import { poissonRegression } from "./glm";
import type { HistoryMatch } from "./history";

/** Saison jouée à huis clos : avantage du domicile estimé à part. */
export const COVID_SEASON = "2021";
/** Repos « court » : 4 jours ou moins depuis le match de Ligue 1 précédent. */
export const SHORT_REST_DAYS = 4;

export interface Hyper {
  halfLifeDays: number;
  sigma: number;
  windowDays: number;
  elo: EloConfig;
}

export const ELO_BASE: Omit<EloConfig, "k" | "promotedRating"> = { homeAdvantage: 60, initialRating: 1500 };

export type ModelMatch = FitMatch & { season: string };

/** Ajoute les drapeaux huis clos et repos court. `matches` doit être trié par jour. */
export function toModelMatches(matches: readonly Pick<HistoryMatch, "season" | "day" | "home" | "away" | "hg" | "ag">[]): ModelMatch[] {
  const last = new Map<string, number>();
  return matches.map((m) => {
    const restHome = m.day - (last.get(m.home) ?? -1000);
    const restAway = m.day - (last.get(m.away) ?? -1000);
    last.set(m.home, m.day);
    last.set(m.away, m.day);
    return {
      season: m.season,
      day: m.day,
      home: m.home,
      away: m.away,
      hg: m.hg,
      ag: m.ag,
      covid: m.season === COVID_SEASON,
      shortRestHome: restHome <= SHORT_REST_DAYS,
      shortRestAway: restAway <= SHORT_REST_DAYS,
    };
  });
}

export interface EloGoalModel {
  /** Constantes log-buts domicile et extérieur à écart d'Elo nul. */
  home: number;
  away: number;
  /** Pente : log-buts pour 400 points d'écart d'Elo. */
  beta: number;
}

/**
 * Régression de Poisson des buts sur l'écart d'Elo d'avant-match, sur les matchs
 * strictement antérieurs à `beforeDay` (la première saison sert de rodage à l'Elo).
 */
export function fitEloGoalModel(matches: readonly ModelMatch[], elo: EloRun, beforeDay: number, burnInSeason: string): EloGoalModel {
  const X: number[][] = [];
  const y: number[] = [];
  matches.forEach((m, i) => {
    if (m.day >= beforeDay || m.season === burnInSeason) return;
    const x = (elo.pre[i].home - elo.pre[i].away) / 400;
    X.push([1, 0, x], [0, 1, -x]);
    y.push(m.hg, m.ag);
  });
  if (X.length === 0) return { home: 0.4, away: 0.15, beta: 0.75 };
  const [home, away, beta] = poissonRegression(X, y);
  return { home, away, beta };
}

/** Moyennes de l'a priori : att = +β·(Elo − moyenne)/400, def = −β·(Elo − moyenne)/400. */
export function eloPrior(ratings: Record<string, number>, currentTeams: readonly string[], beta: number, fallback: number): FitPrior {
  const mean = currentTeams.reduce((s, t) => s + (ratings[t] ?? fallback), 0) / Math.max(1, currentTeams.length);
  const att: Record<string, number> = {};
  const def: Record<string, number> = {};
  for (const team of new Set([...Object.keys(ratings), ...currentTeams])) {
    const z = (beta * ((ratings[team] ?? fallback) - mean)) / 400;
    att[team] = z;
    def[team] = -z;
  }
  return { att, def };
}

export function fitConfig(hyper: Hyper, overrides: Partial<FitConfig> = {}): FitConfig {
  return { halfLifeDays: hyper.halfLifeDays, sigma: hyper.sigma, windowDays: hyper.windowDays, rho: true, covidGamma: true, ...overrides };
}

export { runElo };
