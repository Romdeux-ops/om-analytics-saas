/**
 * Hyperparamètres gelés par saison.
 *
 * Le journal prospectif (`prediction_log`) n'a de valeur que si rien n'est réglé en cours de saison au vu
 * des résultats. Les valeurs ci-dessous sont celles retenues par le backtest du 14 novembre 2026 sur les
 * saisons de validation 2018-19 à 2022-23. Elles ne suivent PAS `backtest-summary.json` : relancer le
 * backtest ne les change pas. On ne modifie une entrée qu'entre deux saisons, en ajoutant la suivante.
 */
import { ELO_BASE, type Hyper } from "./model";

export interface FrozenHyper {
  /** Date du gel (AAAA-MM-JJ). */
  frozenAt: string;
  hyper: Hyper;
}

export const FROZEN_HYPER: Readonly<Record<string, FrozenHyper>> = {
  "2627": {
    frozenAt: "2026-11-14",
    hyper: { halfLifeDays: 365, sigma: 0.15, windowDays: 1500, elo: { ...ELO_BASE, k: 20, promotedRating: 1500 } },
  },
};

/** Hyperparamètres de production d'une saison : gelés, ou erreur s'ils ne l'ont pas encore été. */
export function seasonHyper(season: string): FrozenHyper {
  const frozen = FROZEN_HYPER[season];
  if (!frozen) {
    throw new Error(
      `Aucun hyperparamètre gelé pour la saison ${season}. Lancer le backtest, puis ajouter l'entrée dans frozen-hyper.ts avant le premier match.`,
    );
  }
  return frozen;
}

/** Écriture canonique des hyperparamètres : sert d'empreinte dans le journal prospectif. */
export function hyperSignature(hyper: Hyper): string {
  return [
    `demi-vie=${hyper.halfLifeDays}`,
    `sigma=${hyper.sigma}`,
    `fenetre=${hyper.windowDays}`,
    `elo.k=${hyper.elo.k}`,
    `elo.promu=${hyper.elo.promotedRating}`,
    `elo.domicile=${hyper.elo.homeAdvantage}`,
    `elo.depart=${hyper.elo.initialRating}`,
  ].join(";");
}
