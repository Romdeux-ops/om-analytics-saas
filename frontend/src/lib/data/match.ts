import { cache } from "react";
import { getMatchById, type MatchView } from "@om/db";
import { getDb } from "@/src/lib/db";

/** Déduplique la lecture d'un match entre la page, ses métadonnées et son image de partage. */
export const getMatch = cache(async (matchId: string): Promise<MatchView | null> => {
  const id = Number(matchId);
  if (!Number.isInteger(id)) return null;
  return getMatchById(getDb(), id);
});
