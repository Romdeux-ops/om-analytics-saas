/**
 * Grille de scores Dixon-Coles en forme close.
 * Code pur, sans dépendance : utilisé hors ligne (ajustement, backtest) et dans le navigateur.
 */

export const MAX_GOALS = 10;

/** `grid[x][y]` = probabilité du score final x-y (domicile-extérieur). Somme = 1. */
export type ScoreGrid = number[][];
export type ReadonlyGrid = readonly (readonly number[])[];

export interface OutcomeProbabilities {
  home: number;
  draw: number;
  away: number;
}

export function poissonPmf(lambda: number, max = MAX_GOALS): number[] {
  const pmf: number[] = [];
  let p = Math.exp(-lambda);
  for (let k = 0; k <= max; k++) {
    pmf.push(p);
    p = (p * lambda) / (k + 1);
  }
  return pmf;
}

/** Correction Dixon-Coles des petits scores (ρ < 0 : plus de 0-0 et de 1-1, moins de 1-0 et de 0-1). */
export function dcTau(x: number, y: number, lambdaHome: number, lambdaAway: number, rho: number): number {
  if (x === 0 && y === 0) return 1 - lambdaHome * lambdaAway * rho;
  if (x === 0 && y === 1) return 1 + lambdaHome * rho;
  if (x === 1 && y === 0) return 1 + lambdaAway * rho;
  if (x === 1 && y === 1) return 1 - rho;
  return 1;
}

/** Grille tronquée à `max` buts par équipe, renormalisée. */
export function scoreGrid(lambdaHome: number, lambdaAway: number, rho = 0, max = MAX_GOALS): ScoreGrid {
  const ph = poissonPmf(lambdaHome, max);
  const pa = poissonPmf(lambdaAway, max);
  const grid: ScoreGrid = [];
  let total = 0;
  for (let x = 0; x <= max; x++) {
    const row: number[] = [];
    for (let y = 0; y <= max; y++) {
      const p = ph[x] * pa[y] * Math.max(1e-9, dcTau(x, y, lambdaHome, lambdaAway, rho));
      row.push(p);
      total += p;
    }
    grid.push(row);
  }
  for (const row of grid) for (let y = 0; y < row.length; y++) row[y] /= total;
  return grid;
}

export function gridOutcome(grid: ReadonlyGrid): OutcomeProbabilities {
  let home = 0;
  let draw = 0;
  let away = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      if (x > y) home += grid[x][y];
      else if (x < y) away += grid[x][y];
      else draw += grid[x][y];
    }
  }
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

/** Buts attendus de chaque équipe d'après la grille. */
export function gridMeans(grid: ReadonlyGrid): { home: number; away: number } {
  let home = 0;
  let away = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      home += x * grid[x][y];
      away += y * grid[x][y];
    }
  }
  return { home, away };
}

/** Quadrature de Gauss-Hermite à 5 points pour une loi normale centrée réduite. */
const GH_NODES = [-2.8569700138728, -1.3556261799743, 0, 1.3556261799743, 2.8569700138728];
const GH_WEIGHTS = [0.0112574113277, 0.2220759220056, 0.5333333333333, 0.2220759220056, 0.0112574113277];

/**
 * Grille prédictive : moyenne des grilles sur l'incertitude des paramètres.
 * `log λ_dom ~ N(logHome, sdHome²)` et `log λ_ext ~ N(logAway, sdAway²)`, indépendants
 * (approximation de Laplace diagonale), intégrés par quadrature : déterministe, sans tirage.
 */
export function predictiveGrid(
  logHome: number,
  sdHome: number,
  logAway: number,
  sdAway: number,
  rho = 0,
  max = MAX_GOALS,
): ScoreGrid {
  const out: ScoreGrid = Array.from({ length: max + 1 }, () => new Array<number>(max + 1).fill(0));
  for (let i = 0; i < GH_NODES.length; i++) {
    for (let j = 0; j < GH_NODES.length; j++) {
      const w = GH_WEIGHTS[i] * GH_WEIGHTS[j];
      const g = scoreGrid(Math.exp(logHome + sdHome * GH_NODES[i]), Math.exp(logAway + sdAway * GH_NODES[j]), rho, max);
      for (let x = 0; x <= max; x++) for (let y = 0; y <= max; y++) out[x][y] += w * g[x][y];
    }
  }
  let total = 0;
  for (const row of out) for (const p of row) total += p;
  for (const row of out) for (let y = 0; y < row.length; y++) row[y] /= total;
  return out;
}
