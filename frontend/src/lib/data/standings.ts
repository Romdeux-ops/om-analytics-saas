import { getLigue1Standings } from "@/src/lib/data/competitions";
import type { StandingRow } from "@/src/lib/types/standing";

/**
 * Source unique du classement Ligue 1 (partagée entre la home et /classement).
 */
export async function getStandings(limit?: number): Promise<readonly StandingRow[]> {
  const standings = await getLigue1Standings();
  return typeof limit === "number" ? standings.slice(0, limit) : standings;
}

/**
 * Fenêtre de `size` clubs centrée sur l'OM.
 * Moins de deux clubs d'un côté : on complète de l'autre pour garder `size` lignes
 * (OM 18e → 4 au-dessus ; OM 17e → 3 au-dessus et 1 en dessous ; OM 5e → 2 et 2).
 * Sans l'OM, on retombe sur le haut du tableau.
 */
export function standingsAroundOm<T extends { isOm: boolean }>(
  standings: readonly T[],
  size = 5,
): T[] {
  if (standings.length <= size) return [...standings];

  const omIndex = standings.findIndex((row) => row.isOm);
  if (omIndex < 0) return standings.slice(0, size);

  const above = Math.floor((size - 1) / 2);
  let start = omIndex - above;
  let end = start + size;

  if (start < 0) {
    end -= start;
    start = 0;
  }
  if (end > standings.length) {
    start -= end - standings.length;
    end = standings.length;
  }
  if (start < 0) start = 0;

  return standings.slice(start, end);
}
