import { and, eq, sql } from "drizzle-orm";
import type { Db } from "../client";
import { PREDICTION_POINTS, type Scoreline } from "../prediction-points";
import { predictions } from "../schema";

/**
 * Corrige tous les pronostics d'un match à partir du résultat réel.
 * Idempotent : ne réécrit que les lignes dont les points changent.
 */
export async function scoreMatchPredictions(db: Db, matchId: number, result: Scoreline): Promise<number> {
  const actualSign = Math.sign(result.home - result.away);
  const points = sql<number>`CASE
    WHEN ${predictions.homeScore} = ${result.home} AND ${predictions.awayScore} = ${result.away}
      THEN ${PREDICTION_POINTS.exact}
    WHEN sign((${predictions.homeScore} - ${predictions.awayScore})::numeric)::int = ${actualSign}
      THEN ${PREDICTION_POINTS.outcome}
    ELSE ${PREDICTION_POINTS.miss}
  END`;

  const updated = await db
    .update(predictions)
    .set({ points })
    .where(and(eq(predictions.matchId, matchId), sql`${predictions.points} IS DISTINCT FROM ${points}`))
    .returning({ id: predictions.id });

  return updated.length;
}
