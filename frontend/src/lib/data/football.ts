import { unstable_cache } from "next/cache";
import { getFootballSnapshots, type FootballSnapshot } from "@om/db";
import { getDb } from "@/src/lib/db";
import type { CompetitionId } from "@/src/lib/types/competition";

/** Invalidé à la demande par POST /api/revalidate/football après chaque synchro. */
export const FOOTBALL_CACHE_TAG = "football";

const loadSnapshots = unstable_cache(
  async (): Promise<FootballSnapshot[]> => {
    try {
      return await getFootballSnapshots(getDb());
    } catch (error) {
      console.error("[football] Lecture de football_snapshots impossible, repli sur les données statiques.", error);
      return [];
    }
  },
  ["football-snapshots"],
  { revalidate: 300, tags: [FOOTBALL_CACHE_TAG] },
);

/** Dernière synchro d'une compétition, ou null (les appelants retombent alors sur le statique). */
export async function getFootballSnapshot(competition: CompetitionId): Promise<FootballSnapshot | null> {
  const snapshots = await loadSnapshots();
  return snapshots.find((s) => s.competition === competition) ?? null;
}
