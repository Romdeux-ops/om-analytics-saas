"use server";

import { simulateMatch } from "@om/db";
import { getDb } from "@/src/lib/db";

export async function simulateMatchAction(matchId: number) {
  return simulateMatch(getDb(), matchId);
}
