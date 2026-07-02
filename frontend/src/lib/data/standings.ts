import { MOCK_STANDINGS } from "@/src/lib/mock/standings";
import type { StandingRow } from "@/src/lib/types/standing";

export async function getStandings(limit = 8): Promise<StandingRow[]> {
  return MOCK_STANDINGS.slice(0, limit);
}

export async function getOmStanding(): Promise<StandingRow | undefined> {
  return MOCK_STANDINGS.find((row) => row.isOm);
}
