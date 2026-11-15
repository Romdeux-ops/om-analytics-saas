import { gridMeans, gridOutcome, predictiveGrid } from "./grid";
import type { ClosedFormPrediction, ModelParams } from "./params";

/**
 * Prédiction en forme close d'une affiche de Ligue 1 à partir du JSON (même formule que hors ligne).
 * Renvoie null si l'un des clubs est inconnu du modèle : aucune probabilité ne doit alors être affichée.
 */
export function predictFromParams(params: ModelParams, home: string, away: string): ClosedFormPrediction | null {
  const h = params.teams[home];
  const a = params.teams[away];
  if (!h || !a) return null;
  const grid = predictiveGrid(
    params.league.mu + params.league.gamma + h.att + a.def,
    Math.hypot(h.attSd, a.defSd),
    params.league.mu + a.att + h.def,
    Math.hypot(a.attSd, h.defSd),
    params.league.rho,
  );
  const means = gridMeans(grid);
  return { grid, probabilities: gridOutcome(grid), lambdaHome: means.home, lambdaAway: means.away };
}
