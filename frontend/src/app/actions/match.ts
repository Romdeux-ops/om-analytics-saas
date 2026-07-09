"use server";

import { simulateMatch } from "@om/db";
import { revalidateTag } from "next/cache";
import { getDb } from "@/src/lib/db";

export async function simulateMatchAction(matchId: number) {
  const result = await simulateMatch(getDb(), matchId);
  revalidateTag("matches");
  return result;
}
