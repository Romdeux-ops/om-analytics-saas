/**
 * Probabilités en direct du moteur « score d'abord », en forme close.
 *
 * Modèle génératif (voir `engines/dixon-coles.ts`) :
 *   1. scénario de cartons rouges : au plus un par équipe, minute tirée indépendamment du score ;
 *   2. score final (x, y) tiré dans la grille prédite, indépendamment des cartons ;
 *   3. sachant x, les minutes des buts d'une équipe sont indépendantes, de densité proportionnelle
 *      au profil temporel × l'effet d'une infériorité numérique (un rouge déplace le moment des
 *      buts, jamais leur nombre).
 *
 * À l'instant t, l'observateur connaît le score et les rouges déjà sortis, pas les rouges à venir.
 * La loi a posteriori du score final marginalise donc sur les rouges futurs compatibles :
 *
 *   P(x, y | histoire) ∝ G(x, y) · C(x, a) · C(y, b) · E_rouges futurs[ L_dom(x) · L_ext(y) ]
 *   L(x) = Z^(−a) · ((Z − A) / Z)^(x − a)
 *
 * avec a, b les buts déjà marqués, A la masse d'intensité écoulée (fixée par l'histoire) et Z la masse
 * totale (qui dépend des rouges futurs). Rien de ce qui se passe après t n'entre dans le calcul.
 */
import type { Side } from "./types";

export interface LiveContext {
  /** Grille de scores d'avant-match : `grid[x][y]`. */
  grid: readonly (readonly number[])[];
  /** Durée totale et fin de première période sur l'axe de lecture (temps additionnel compris). */
  duration: number;
  halfTimeAt: number;
  /** Part des buts marqués en première période. */
  firstHalfShare: number;
  /** Multiplicateurs du rythme de but quand une équipe est réduite à dix. */
  redEffect: { ownFactor: number; opponentFactor: number };
  /** Probabilité d'au moins un carton rouge par équipe sur le match. */
  redProbability: Record<Side, number>;
}

/** Ce que l'on sait à l'instant t. `red[side]` = minute du rouge s'il est déjà sorti, sinon null. */
export interface LiveState {
  t: number;
  goals: Record<Side, number>;
  red: Record<Side, number | null>;
}

export type RedScenario = Record<Side, number | null>;

/** Nombre de tranches de temps pour intégrer sur la minute d'un rouge futur (quadrature au point milieu). */
const FUTURE_RED_SLOTS = 6;

const other = (side: Side): Side => (side === "home" ? "away" : "home");

/** Part cumulée des buts attendus à l'instant u, sans carton rouge (uniforme dans chaque période). */
export function baseProfile(ctx: Pick<LiveContext, "duration" | "halfTimeAt" | "firstHalfShare">, u: number): number {
  if (u <= 0) return 0;
  if (u >= ctx.duration) return 1;
  if (u <= ctx.halfTimeAt) return (ctx.firstHalfShare * u) / ctx.halfTimeAt;
  return ctx.firstHalfShare + ((1 - ctx.firstHalfShare) * (u - ctx.halfTimeAt)) / (ctx.duration - ctx.halfTimeAt);
}

/** Loi a priori de la minute d'un rouge, sachant qu'il y en a un : densité croissante, F(u) = (u / durée)². */
export function redTimeCdf(ctx: Pick<LiveContext, "duration">, u: number): number {
  const r = Math.min(1, Math.max(0, u / ctx.duration));
  return r * r;
}

/** Multiplicateur du rythme de but de `side` à l'instant u dans un scénario de cartons rouges. */
function redMultiplier(ctx: LiveContext, side: Side, u: number, red: RedScenario): number {
  const own = red[side];
  const opp = red[other(side)];
  return (own !== null && u > own ? ctx.redEffect.ownFactor : 1) * (opp !== null && u > opp ? ctx.redEffect.opponentFactor : 1);
}

/** Tronçons [début, fin] d'intensité constante pour `side`, et leur masse. Sert aussi à tirer les minutes des buts. */
export function intensitySegments(ctx: LiveContext, side: Side, red: RedScenario, from = 0, to = ctx.duration) {
  const cuts = [from, to];
  for (const c of [ctx.halfTimeAt, red.home, red.away]) if (c !== null && c > from && c < to) cuts.push(c);
  cuts.sort((a, b) => a - b);
  const segments: { start: number; end: number; mass: number }[] = [];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const start = cuts[i];
    const end = cuts[i + 1];
    if (end <= start) continue;
    const mass = (baseProfile(ctx, end) - baseProfile(ctx, start)) * redMultiplier(ctx, side, (start + end) / 2, red);
    segments.push({ start, end, mass });
  }
  return segments;
}

function intensityMass(ctx: LiveContext, side: Side, red: RedScenario, from: number, to: number): number {
  let total = 0;
  for (const s of intensitySegments(ctx, side, red, from, to)) total += s.mass;
  return total;
}

/** Scénarios possibles pour le rouge d'une équipe, vus de l'instant t : [minute ou null, probabilité]. */
function redOptions(ctx: LiveContext, side: Side, state: LiveState): [number | null, number][] {
  const known = state.red[side];
  if (known !== null) return [[known, 1]];
  const p = ctx.redProbability[side];
  if (p <= 0 || state.t >= ctx.duration) return [[null, 1]];
  const survive = 1 - p * redTimeCdf(ctx, state.t);
  const options: [number | null, number][] = [[null, (1 - p) / survive]];
  const width = (ctx.duration - state.t) / FUTURE_RED_SLOTS;
  for (let j = 0; j < FUTURE_RED_SLOTS; j++) {
    const start = state.t + j * width;
    const weight = (p * (redTimeCdf(ctx, start + width) - redTimeCdf(ctx, start))) / survive;
    options.push([start + width / 2, weight]);
  }
  return options;
}

function binomial(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let c = 1;
  for (let i = 1; i <= k; i++) c = (c * (n - k + i)) / i;
  return c;
}

/** Loi a posteriori du score final à l'instant t (même forme que la grille, somme = 1). */
export function liveScoreDistribution(ctx: LiveContext, state: LiveState): number[][] {
  const max = ctx.grid.length - 1;
  const a = Math.min(max, state.goals.home);
  const b = Math.min(max, state.goals.away);
  const weight: number[][] = Array.from({ length: max + 1 }, () => new Array<number>(max + 1).fill(0));

  const likelihood = (side: Side, scored: number, red: RedScenario): number[] => {
    const elapsed = intensityMass(ctx, side, red, 0, state.t);
    const total = elapsed + intensityMass(ctx, side, red, state.t, ctx.duration);
    const remaining = Math.max(0, total - elapsed) / total;
    const out = new Array<number>(max + 1).fill(0);
    let value = total ** -scored;
    for (let x = scored; x <= max; x++) {
      out[x] = value;
      value *= remaining;
    }
    return out;
  };

  for (const [redHome, wHome] of redOptions(ctx, "home", state)) {
    for (const [redAway, wAway] of redOptions(ctx, "away", state)) {
      const red: RedScenario = { home: redHome, away: redAway };
      const lh = likelihood("home", a, red);
      const la = likelihood("away", b, red);
      const w = wHome * wAway;
      for (let x = a; x <= max; x++) {
        if (lh[x] === 0) continue;
        for (let y = b; y <= max; y++) weight[x][y] += w * lh[x] * la[y];
      }
    }
  }

  let total = 0;
  for (let x = a; x <= max; x++) {
    for (let y = b; y <= max; y++) {
      weight[x][y] *= ctx.grid[x][y] * binomial(x, a) * binomial(y, b);
      total += weight[x][y];
    }
  }
  if (total <= 0) {
    // Score hors du support de la grille : il ne peut plus bouger dans ce modèle.
    weight[a][b] = 1;
    total = 1;
  }
  for (let x = 0; x <= max; x++) for (let y = 0; y <= max; y++) weight[x][y] /= total;
  return weight;
}

/** Probabilités 1/N/2 du résultat final à l'instant t. */
export function liveOutcome(ctx: LiveContext, state: LiveState): { home: number; draw: number; away: number } {
  const dist = liveScoreDistribution(ctx, state);
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let x = 0; x < dist.length; x++) {
    for (let y = 0; y < dist[x].length; y++) {
      if (x > y) home += dist[x][y];
      else if (x < y) away += dist[x][y];
      else draw += dist[x][y];
    }
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}
