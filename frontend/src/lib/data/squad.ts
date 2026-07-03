import {
  getCoach as getCoachDb,
  getSquad as getSquadDb,
  getSquadTotalMarketValue as getSquadTotalMarketValueDb,
  type PlayerView,
} from "@om/db";
import { getDb } from "@/src/lib/db";

const OM_CLUB_NAME = "Olympique de Marseille";

export async function getOmSquad(): Promise<PlayerView[]> {
  return getSquadDb(getDb(), OM_CLUB_NAME);
}

export async function getOmCoach(): Promise<string | null> {
  return getCoachDb(getDb(), OM_CLUB_NAME);
}

export async function getOmSquadTotalValue(): Promise<number> {
  return getSquadTotalMarketValueDb(getDb(), OM_CLUB_NAME);
}

export type { PlayerView };
