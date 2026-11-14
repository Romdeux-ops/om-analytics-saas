import summary from "../data/backtest-summary.json";
import type { ComponentStatus, ModelParams } from "./params";
import { ELO_BASE, type Hyper } from "./model";

interface BacktestSummary {
  generatedAt: string;
  testSeasons: string[];
  selected: { halfLifeDays: number | null; sigma: number; windowDays: number; eloK: number; promotedRating: number; recalibrationPower: number | null };
  test: { matches: number; rps: Record<string, number>; logloss: Record<string, number>; components?: ComponentStatus[] };
}

const backtest = summary as unknown as BacktestSummary;

/**
 * Hyperparamètres retenus par le dernier backtest (`bun run model:backtest`), choisis sur les saisons
 * de validation. Ils ne sont jamais réglés à la main : relancer le backtest pour les changer.
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
};
