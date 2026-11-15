import type { OutcomeProbabilities, ScoreGrid } from "./grid";

/** 0 = victoire à domicile, 1 = nul, 2 = victoire à l'extérieur. */
export type Outcome = 0 | 1 | 2;

export const outcomeOf = (homeGoals: number, awayGoals: number): Outcome =>
  homeGoals > awayGoals ? 0 : homeGoals === awayGoals ? 1 : 2;

export const asTriple = (p: OutcomeProbabilities): [number, number, number] => [p.home, p.draw, p.away];

/** Ranked probability score (issues ordonnées 1 / N / 2), entre 0 et 1, plus petit = meilleur. */
export function rps(p: readonly number[], o: Outcome): number {
  const c1 = p[0] - (o === 0 ? 1 : 0);
  const c2 = p[0] + p[1] - (o <= 1 ? 1 : 0);
  return (c1 * c1 + c2 * c2) / 2;
}

export const logLoss = (p: readonly number[], o: Outcome): number => -Math.log(Math.max(1e-12, p[o]));

export const brier = (p: readonly number[], o: Outcome): number =>
  (p[0] - (o === 0 ? 1 : 0)) ** 2 + (p[1] - (o === 1 ? 1 : 0)) ** 2 + (p[2] - (o === 2 ? 1 : 0)) ** 2;

/** Log-perte du score exact (les scores au-delà de la grille sont ramenés au bord). */
export function scoreLogLoss(grid: ScoreGrid, homeGoals: number, awayGoals: number): number {
  const max = grid.length - 1;
  return -Math.log(Math.max(1e-12, grid[Math.min(max, homeGoals)][Math.min(max, awayGoals)]));
}
