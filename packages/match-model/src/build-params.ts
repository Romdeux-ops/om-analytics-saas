/** Génération du JSON de paramètres : Elo, ajustement, fréquences d'événements, affiches de la journée. Hors navigateur. */
import { fitDixonColes, matchLogRates, type FitResult } from "./fit";
import { poissonRegression } from "./glm";
import { gridMeans, gridOutcome, predictiveGrid, scoreGrid, type OutcomeProbabilities } from "./grid";
import { dayNumber, seasonLabel, seasonTeams, type HistoryMatch } from "./history";
import { ELO_BASE, eloPrior, fitConfig, fitEloGoalModel, runElo, toModelMatches, type EloGoalModel, type Hyper } from "./model";
import {
  DEFAULT_EVENT_RATES,
  PARAMS_SCHEMA_VERSION,
  type ComponentStatus,
  type CountModel,
  type EventRates,
  type FixturePrediction,
  type ModelParams,
} from "./params";

export interface SeasonResult {
  /** AAAA-MM-JJ ou ISO complet. */
  date: string;
  home: string;
  away: string;
  hg: number;
  ag: number;
}

export interface SeasonFixture {
  matchday: number;
  date: string;
  home: string;
  away: string;
}

export interface BuildInput {
  history: readonly HistoryMatch[];
  /** Code de la saison en cours (« 2627 »). */
  season: string;
  /** Résultats de la saison en cours (football-data.org) : complètent l'historique. */
  results?: readonly SeasonResult[];
  /** Affiches réelles de la journée à prédire. */
  fixtures?: readonly SeasonFixture[];
  matchday?: number | null;
  /** Clubs engagés cette saison (sinon déduits des matchs connus). */
  teams?: readonly string[];
  hyper: Hyper;
  components?: ComponentStatus[];
  backtest?: ModelParams["backtest"];
  now: Date;
  sources?: Partial<ModelParams["sources"]>;
}

const round = (x: number, digits = 4) => Number(x.toFixed(digits));

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Historique + résultats récents, sans doublon (une affiche domicile/extérieur par saison). */
export function mergeResults(history: readonly HistoryMatch[], season: string, results: readonly SeasonResult[] = []): HistoryMatch[] {
  const known = new Set(history.filter((m) => m.season === season).map((m) => `${m.home}|${m.away}`));
  const extra = results
    .filter((r) => !known.has(`${r.home}|${r.away}`))
    .map((r): HistoryMatch => {
      const date = r.date.slice(0, 10);
      return { season, date, day: dayNumber(date), home: r.home, away: r.away, hg: r.hg, ag: r.ag, hthg: null, htag: null, stats: null, odds: null, xg: null };
    });
  return [...history, ...extra].sort((a, b) => a.day - b.day);
}

/** Fréquences d'événements mesurées sur les matchs fournis, en fonction des buts attendus d'après l'Elo. */
export function measureEventRates(
  matches: readonly HistoryMatch[],
  expected: (m: HistoryMatch) => { home: number; away: number } | null,
  seasons: readonly string[],
): EventRates {
  const rows = matches.filter((m) => seasons.includes(m.season) && m.stats && expected(m));
  if (rows.length < 200) return DEFAULT_EVENT_RATES;

  const countModel = (value: (m: HistoryMatch, side: "home" | "away") => number): CountModel & { dispersion: number } => {
    const X: number[][] = [];
    const y: number[] = [];
    for (const m of rows) {
      const l = expected(m)!;
      X.push([1, 0, Math.log(l.home), Math.log(l.away)], [0, 1, Math.log(l.away), Math.log(l.home)]);
      y.push(value(m, "home"), value(m, "away"));
    }
    // Les buts attendus d'après l'Elo ne dépendent que de l'écart d'Elo : log λ_propre et log λ_adverse
    // sont exactement colinéaires. Seul l'effet du rapport de forces (log λ_propre − log λ_adverse) est
    // identifiable ; on l'estime avec une pente unique, répartie en +κ et −κ.
    const [homeIntercept, awayIntercept, slope] = poissonRegression(X.map((x) => [x[0], x[1], x[2] - x[3]]), y);
    const ownSlope = slope;
    const opponentSlope = -slope;
    // Surdispersion par la méthode des moments : Var = μ + μ²/k.
    let num = 0;
    let den = 0;
    X.forEach((x, i) => {
      const mu = Math.exp(x[0] * homeIntercept + x[1] * awayIntercept + x[2] * ownSlope + x[3] * opponentSlope);
      num += (y[i] - mu) ** 2 - mu;
      den += mu * mu;
    });
    const dispersion = num > 0 ? den / num : 1000;
    return { homeIntercept: round(homeIntercept), awayIntercept: round(awayIntercept), ownSlope: round(ownSlope), opponentSlope: round(opponentSlope), dispersion: round(dispersion, 2) };
  };

  const sum = (f: (m: HistoryMatch) => number) => rows.reduce((s, m) => s + f(m), 0);
  const shots = countModel((m, side) => Math.max(0, (side === "home" ? m.stats!.hs - m.hg : m.stats!.as - m.ag)));
  const { dispersion: _unused, ...corners } = countModel((m, side) => (side === "home" ? m.stats!.hc : m.stats!.ac));
  void _unused;
  const nonGoalShots = sum((m) => Math.max(0, m.stats!.hs - m.hg) + Math.max(0, m.stats!.as - m.ag));
  const nonGoalOnTarget = sum((m) => Math.max(0, m.stats!.hst - m.hg) + Math.max(0, m.stats!.ast - m.ag));
  const halves = rows.filter((m) => m.hthg !== null && m.htag !== null);
  const n = rows.length;

  return {
    nonGoalShots: shots,
    onTargetShare: round(nonGoalOnTarget / nonGoalShots),
    corners,
    fouls: { home: round(sum((m) => m.stats!.hf) / n, 2), away: round(sum((m) => m.stats!.af) / n, 2) },
    yellowPerFoul: { home: round(sum((m) => m.stats!.hy) / sum((m) => m.stats!.hf)), away: round(sum((m) => m.stats!.ay) / sum((m) => m.stats!.af)) },
    redProbability: { home: round(rows.filter((m) => m.stats!.hr > 0).length / n), away: round(rows.filter((m) => m.stats!.ar > 0).length / n) },
    firstHalfGoalShare: round(halves.reduce((s, m) => s + m.hthg! + m.htag!, 0) / halves.reduce((s, m) => s + m.hg + m.ag, 0)),
    redCardEffect: DEFAULT_EVENT_RATES.redCardEffect,
    sample: { seasons: [...seasons], matches: n },
  };
}

function predictFixture(fit: FitResult, fixture: SeasonFixture): FixturePrediction {
  const r = matchLogRates(fit, fixture.home, fixture.away);
  const grid = predictiveGrid(r.logHome, r.sdHome, r.logAway, r.sdAway, fit.rho);
  const means = gridMeans(grid);
  // Intervalle : tirages des forces dans leur loi a posteriori (graine dérivée de l'affiche).
  let seed = 0;
  for (const ch of `${fixture.home}|${fixture.away}`) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0;
  const random = mulberry(seed);
  const normal = () => Math.sqrt(-2 * Math.log(1 - random())) * Math.cos(2 * Math.PI * random());
  const draws: OutcomeProbabilities[] = [];
  for (let i = 0; i < 1000; i++) {
    draws.push(gridOutcome(scoreGrid(Math.exp(r.logHome + r.sdHome * normal()), Math.exp(r.logAway + r.sdAway * normal()), fit.rho)));
  }
  const interval = (key: keyof OutcomeProbabilities): [number, number] => {
    const v = draws.map((d) => d[key]).sort((a, b) => a - b);
    return [round(v[50]), round(v[949])];
  };
  const roundOutcome = (p: OutcomeProbabilities) => ({ home: round(p.home), draw: round(p.draw), away: round(p.away) });
  return {
    matchday: fixture.matchday,
    date: fixture.date,
    home: fixture.home,
    away: fixture.away,
    lambdaHome: round(means.home, 3),
    lambdaAway: round(means.away, 3),
    grid: grid.map((row) => row.map((p) => round(p, 6))),
    probabilities: roundOutcome(gridOutcome(grid)),
    pointEstimate: roundOutcome(gridOutcome(scoreGrid(Math.exp(r.logHome), Math.exp(r.logAway), fit.rho))),
    interval: { home: interval("home"), draw: interval("draw"), away: interval("away") },
  };
}

export function buildModelParams(input: BuildInput): ModelParams {
  const all = mergeResults(input.history, input.season, input.results);
  const teamsBySeason = seasonTeams(all);
  const current = [...new Set([...(teamsBySeason[input.season] ?? []), ...(input.teams ?? []), ...(input.fixtures ?? []).flatMap((f) => [f.home, f.away])])].sort();
  teamsBySeason[input.season] = current;
  const seasons = Object.keys(teamsBySeason).sort();
  const previous = seasons[seasons.indexOf(input.season) - 1];

  const matches = toModelMatches(all);
  const eloConfig = { ...ELO_BASE, ...input.hyper.elo };
  const elo = runElo(matches, teamsBySeason, eloConfig);
  const fitDay = dayNumber(input.now.toISOString()) + 1;
  const goals: EloGoalModel = fitEloGoalModel(matches, elo, fitDay, seasons[0]);
  const prior = eloPrior(elo.final, current, goals.beta, eloConfig.initialRating);
  const fit = fitDixonColes(matches, fitDay, fitConfig(input.hyper), prior, current);

  // Fréquences d'événements : trois dernières saisons complètes, buts attendus d'après l'Elo d'avant-match.
  const expectedByMatch = new Map<HistoryMatch, { home: number; away: number }>();
  all.forEach((m, i) => {
    const x = (elo.pre[i].home - elo.pre[i].away) / 400;
    expectedByMatch.set(m, { home: Math.exp(goals.home + goals.beta * x), away: Math.exp(goals.away - goals.beta * x) });
  });
  const complete = seasons.filter((s) => s < input.season).slice(-3);
  const eventRates = measureEventRates(all, (m) => expectedByMatch.get(m) ?? null, complete);

  const teams: ModelParams["teams"] = {};
  for (const team of current) {
    teams[team] = {
      att: round(fit.att[team]),
      def: round(fit.def[team]),
      attSd: round(fit.attSd[team]),
      defSd: round(fit.defSd[team]),
      elo: round(elo.final[team] ?? eloConfig.initialRating, 1),
      priorAtt: round(prior.att[team] ?? 0),
      priorDef: round(prior.def[team] ?? 0),
      promoted: !!previous && !teamsBySeason[previous].includes(team),
      effectiveMatches: round(fit.effectiveMatches[team] ?? 0, 1),
    };
  }

  const withXg = all.filter((m) => m.season === input.season && m.xg);
  const xgTeams: Record<string, { for: number; against: number; matches: number }> = {};
  for (const m of withXg) {
    for (const [team, f, a] of [[m.home, m.xg!.h, m.xg!.a], [m.away, m.xg!.a, m.xg!.h]] as const) {
      const cell = (xgTeams[team] ??= { for: 0, against: 0, matches: 0 });
      cell.for = round(cell.for + f, 2);
      cell.against = round(cell.against + a, 2);
      cell.matches += 1;
    }
  }

  const lastMatch = all.filter((m) => m.day < fitDay).at(-1);
  const eloMean = current.reduce((s, t) => s + (elo.final[t] ?? eloConfig.initialRating), 0) / Math.max(1, current.length);

  return {
    schemaVersion: PARAMS_SCHEMA_VERSION,
    generatedAt: input.now.toISOString(),
    dataThrough: lastMatch?.date ?? "",
    matchesUsed: fit.matches,
    seasonResults: all.filter((m) => m.season === input.season).length,
    season: seasonLabel(input.season),
    sources: {
      history: "football-data.co.uk (résultats, statistiques, cotes de clôture)",
      results: "football-data.org /v4/competitions/FL1/matches",
      fixtures: input.fixtures?.length ? "football-data.org (calendrier réel)" : "indisponible",
      elo: "Elo interne calculé sur les résultats de Ligue 1",
      ...input.sources,
    },
    league: {
      mu: round(fit.mu),
      gamma: round(fit.gamma),
      homeFactor: round(Math.exp(fit.gamma), 3),
      rho: round(fit.rho),
      beta: round(goals.beta),
      sigma: input.hyper.sigma,
      halfLifeDays: input.hyper.halfLifeDays === Infinity ? null : input.hyper.halfLifeDays,
      windowDays: input.hyper.windowDays,
      elo: { k: eloConfig.k, homeAdvantage: eloConfig.homeAdvantage, promotedRating: eloConfig.promotedRating, mean: round(eloMean, 1) },
    },
    teams,
    eventRates,
    matchday: input.matchday ?? null,
    fixtures: (input.fixtures ?? []).filter((f) => fit.att[f.home] !== undefined && fit.att[f.away] !== undefined).map((f) => predictFixture(fit, f)),
    components: input.components ?? [],
    backtest: input.backtest ?? null,
    xg: withXg.length
      ? { used: false, source: "football-data.co.uk, colonnes HxG / AxG (fournisseur non précisé dans la notice)", matches: withXg.length, perTeam: xgTeams }
      : null,
  };
}
