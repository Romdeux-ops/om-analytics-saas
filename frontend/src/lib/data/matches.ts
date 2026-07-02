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
  return getUpcomingMatchesDb(getDb(), limit);
}
