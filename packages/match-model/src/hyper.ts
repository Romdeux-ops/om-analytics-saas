import summary from "../data/backtest-summary.json";
import type { ComponentStatus, HighConfidenceCalibration, ModelParams } from "./params";
import { ELO_BASE, type Hyper } from "./model";

interface BacktestSummary {
  generatedAt: string;
  testSeasons: string[];
  selected: { halfLifeDays: number | null; sigma: number; windowDays: number; eloK: number; promotedRating: number; recalibrationPower: number | null };
  test: {
    matches: number;
    rps: Record<string, number>;
    logloss: Record<string, number>;
    components?: ComponentStatus[];
    highConfidence?: HighConfidenceCalibration;
  };
}

const backtest = summary as unknown as BacktestSummary;

/**
 * Hyperparamètres retenus par le dernier backtest (`bun run model:backtest`), choisis sur les saisons
 * de validation. ATTENTION : la production n'utilise pas cette valeur mais celle gelée pour la saison
 * (`frozen-hyper.ts`). Celle-ci sert à préparer le gel de la saison suivante.
 */
export const SELECTED_HYPER: Hyper = {
  halfLifeDays: backtest.selected.halfLifeDays ?? Infinity,
  sigma: backtest.selected.sigma,
  windowDays: backtest.selected.windowDays,
  elo: { ...ELO_BASE, k: backtest.selected.eloK, promotedRating: backtest.selected.promotedRating },
};

export const BACKTEST_COMPONENTS: ComponentStatus[] = backtest.test.components ?? [];

export const BACKTEST_HEADLINE: NonNullable<ModelParams["backtest"]> = {
  generatedAt: backtest.generatedAt,
  testSeasons: backtest.testSeasons,
  matches: backtest.test.matches,
  rps: backtest.test.rps,
  logloss: backtest.test.logloss,
  highConfidence: backtest.test.highConfidence,
};
