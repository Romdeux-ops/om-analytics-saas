/**
 * Construction des entrées du moteur à partir du JSON de paramètres produit hors ligne.
 *
 * Règle d'admission : seules les entrées validées par le backtest déplacent la probabilité
 * (forces, Elo, avantage du domicile). Compositions, absences, repos et forme ESPN n'y entrent
 * pas : ils ne servent qu'à habiller le déroulé (noms des joueurs).
 */
import { gridMeans, gridOutcome, predictFromParams, type ModelParams } from "@om/match-model";
import type { MatchModelInput, ModelTeamInfo } from "./types";

function teamInfo(params: ModelParams, name: string): ModelTeamInfo {
  const t = params.teams[name];
  return { att: t.att, def: t.def, elo: t.elo, promoted: t.promoted, effectiveMatches: t.effectiveMatches };
}

/**
 * Prédiction d'une affiche de Ligue 1, ou `undefined` si l'un des clubs est inconnu du modèle
 * (match européen, coupe) : aucune probabilité ne doit alors être affichée.
 */
export function buildModelInput(params: ModelParams | null | undefined, home: string, away: string): MatchModelInput | undefined {
  if (!params || !params.teams[home] || !params.teams[away]) return undefined;
  const base = {
    eventRates: params.eventRates,
    provenance: {
      generatedAt: params.generatedAt,
      dataThrough: params.dataThrough,
      matchesUsed: params.matchesUsed,
      homeFactor: params.league.homeFactor,
      rho: params.league.rho,
      home: teamInfo(params, home),
      away: teamInfo(params, away),
    },
  };

  // Affiche du calendrier réel : grille prédictive et intervalle calculés hors ligne.
  const fixture = params.fixtures.find((f) => f.home === home && f.away === away);
  if (fixture) {
    return {
      grid: fixture.grid,
      lambdaHome: fixture.lambdaHome,
      lambdaAway: fixture.lambdaAway,
      ...base,
      provenance: { ...base.provenance, source: "calendrier", pointEstimate: fixture.pointEstimate, interval: fixture.interval },
    };
  }

  // Autre affiche de Ligue 1 : même formule, calculée ici en forme close à partir des forces.
  const prediction = predictFromParams(params, home, away);
  if (!prediction) return undefined;
  return {
    grid: prediction.grid,
    lambdaHome: prediction.lambdaHome,
    lambdaAway: prediction.lambdaAway,
    ...base,
    provenance: { ...base.provenance, source: "forces" },
  };
}

/** Probabilités 1/N/2 et buts attendus d'avant-match portés par une entrée de modèle. */
export function modelSummary(model: MatchModelInput) {
  return { probabilities: gridOutcome(model.grid), expected: gridMeans(model.grid) };
}

export interface RealFixture {
  home: string;
  away: string;
  model: MatchModelInput;
}

/** Ce que la page transmet au simulateur : prédiction du match et affiches réelles de la journée. */
export interface SimulationModelData {
  /** Absent : match hors Ligue 1 ou club inconnu du modèle → aucune probabilité affichée. */
  main?: MatchModelInput;
  /** Autres affiches réelles de la journée, ou null si le calendrier réel est indisponible. */
  multiplex: RealFixture[] | null;
}

export function buildSimulationModelData(params: ModelParams | null | undefined, home: string, away: string): SimulationModelData {
  const main = buildModelInput(params, home, away);
  if (!params || !main) return { main, multiplex: null };
  // Le multiplex réel n'a de sens que si le match affiché fait partie de la journée prédite.
  const inMatchday = params.fixtures.some((f) => f.home === home && f.away === away);
  if (!inMatchday) return { main, multiplex: null };
  const others = params.fixtures.filter((f) => !(f.home === home && f.away === away));
  const multiplex = others.flatMap((f) => {
    const model = buildModelInput(params, f.home, f.away);
    return model ? [{ home: f.home, away: f.away, model }] : [];
  });
  return { main, multiplex: multiplex.length > 0 ? multiplex : null };
}
