import { getLigue1Standings } from "@/src/lib/data/competitions";
import type { StandingRow } from "@/src/lib/types/standing";

/**
 * Source unique du classement Ligue 1 (partagée entre la home et /classement).
 */
export async function getStandings(limit?: number): Promise<readonly StandingRow[]> {
  const standings = getLigue1Standings();
  return typeof limit === "number" ? standings.slice(0, limit) : standings;
}
