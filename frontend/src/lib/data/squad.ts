import { unstable_cache } from "next/cache";
import { getSquadPageData as getSquadPageDataDb, type PlayerView, type SquadPageData } from "@om/db";
import { getDb } from "@/src/lib/db";

const OM_CLUB_NAME = "Olympique de Marseille";

const getCachedSquadPageData = unstable_cache(
  async () => getSquadPageDataDb(getDb(), OM_CLUB_NAME),
  ["om-squad-page"],
  { revalidate: 60, tags: ["squad"] },
);

export async function getOmSquadPageData(): Promise<SquadPageData> {
  return getCachedSquadPageData();
}

/** @deprecated Préférer getOmSquadPageData() pour une seule passe DB. */
export async function getOmSquad(): Promise<PlayerView[]> {
  const { squad } = await getOmSquadPageData();
  return squad;
}

/** @deprecated Préférer getOmSquadPageData(). */
export async function getOmCoach(): Promise<string | null> {
  const { coach } = await getOmSquadPageData();
  return coach;
}

/** @deprecated Préférer getOmSquadPageData(). */
export async function getOmSquadTotalValue(): Promise<number> {
  const { totalMarketValue } = await getOmSquadPageData();
  return totalMarketValue;
}

export type { PlayerView, SquadPageData };
