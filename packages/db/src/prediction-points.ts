/** Barème des pronostics. Dupliqué dans prediction_leaderboard (exact_count = points 3). */
export const PREDICTION_POINTS = {
  exact: 3,
  outcome: 1,
  miss: 0,
} as const;

export interface Scoreline {
  home: number;
  away: number;
}

export function predictionPoints(prediction: Scoreline, result: Scoreline): number {
  if (prediction.home === result.home && prediction.away === result.away) {
    return PREDICTION_POINTS.exact;
  }
  const predicted = Math.sign(prediction.home - prediction.away);
  const actual = Math.sign(result.home - result.away);
  return predicted === actual ? PREDICTION_POINTS.outcome : PREDICTION_POINTS.miss;
}
