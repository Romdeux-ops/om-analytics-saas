import { unstable_cache } from "next/cache";
import {
  getNextOmMatch as getNextOmMatchDb,
  getUpcomingMatches as getUpcomingMatchesDb,
  type MatchView,
} from "@om/db";
import { getDb } from "@/src/lib/db";

export async function getNextOmMatch(): Promise<MatchView | null> {
  return getNextOmMatchDb(getDb());
}

export async function getUpcomingMatches(limit = 10): Promise<MatchView[]> {
  return unstable_cache(
    async () => getUpcomingMatchesDb(getDb(), limit),
    ["upcoming-matches", String(limit)],
    { revalidate: 30, tags: ["matches"] },
  )();
}
