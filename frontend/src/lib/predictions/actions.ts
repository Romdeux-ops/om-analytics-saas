"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getMatch } from "@/src/lib/data/match";
import { createClient } from "@/src/lib/supabase/server";
import { MAX_PREDICTED_GOALS, MAX_RATED_PLAYERS } from "./constants";
import { getRateablePlayers } from "./queries.server";
import { hasKickedOff, isValidGoalCount, isValidRating, ratingWindow } from "./window";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function savePredictionAction(
  matchId: number,
  homeScore: number,
  awayScore: number,
): Promise<ActionResult> {
  if (!isValidGoalCount(homeScore) || !isValidGoalCount(awayScore)) {
    return { ok: false, error: `Score invalide (0 à ${MAX_PREDICTED_GOALS} buts).` };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const match = await getMatch(String(matchId));
  if (!match) return { ok: false, error: "Match introuvable." };
  if (hasKickedOff(match.date)) {
    return { ok: false, error: "Les pronos sont clos : le match a commencé." };
  }

  const { error } = await supabase
    .from("predictions")
    .upsert(
      { match_id: matchId, user_id: user.id, home_score: homeScore, away_score: awayScore },
      { onConflict: "match_id,user_id" },
    );
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/simulation/${matchId}`);
  revalidatePath("/pronostics");
  return { ok: true };
}

export interface RatingInput {
  playerKey: string;
  rating: number;
}

export async function submitRatingsAction(
  matchId: number,
  ratings: RatingInput[],
  motmKey: string | null,
): Promise<ActionResult> {
  if (ratings.length === 0) return { ok: false, error: "Note au moins un joueur." };
  if (ratings.length > MAX_RATED_PLAYERS) return { ok: false, error: "Trop de joueurs notés." };
  if (ratings.some((r) => !isValidRating(r.rating))) {
    return { ok: false, error: "Les notes vont de 1 à 10, par demi-point." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Connexion requise." };

  const match = await getMatch(String(matchId));
  if (!match) return { ok: false, error: "Match introuvable." };

  const window = ratingWindow(match.date);
  if (window === "upcoming") return { ok: false, error: "Les notes ouvrent 2 h après le coup d'envoi." };
  if (window === "closed") return { ok: false, error: "Les notes de ce match sont closes." };

  const players = new Map((await getRateablePlayers(match)).map((p) => [p.key, p]));
  const unique = new Map(ratings.map((r) => [r.playerKey, r.rating]));
  if ([...unique.keys()].some((key) => !players.has(key))) {
    return { ok: false, error: "Joueur inconnu dans la composition de ce match." };
  }
  if (motmKey && !unique.has(motmKey)) {
    return { ok: false, error: "Ton homme du match doit faire partie des joueurs notés." };
  }

  const { data: existing, error: existingError } = await supabase
    .from("player_ratings")
    .select("player_key")
    .eq("match_id", matchId)
    .eq("user_id", user.id);
  if (existingError) return { ok: false, error: existingError.message };

  const { error: upsertError } = await supabase.from("player_ratings").upsert(
    [...unique].map(([playerKey, rating]) => ({
      match_id: matchId,
      user_id: user.id,
      player_key: playerKey,
      player_name: players.get(playerKey)!.name,
      rating,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "match_id,user_id,player_key" },
  );
  if (upsertError) return { ok: false, error: upsertError.message };

  const removed = (existing ?? []).map((r) => r.player_key).filter((key) => !unique.has(key));
  if (removed.length > 0) {
    const { error } = await supabase
      .from("player_ratings")
      .delete()
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .in("player_key", removed);
    if (error) return { ok: false, error: error.message };
  }

  const motmResult = motmKey
    ? await supabase.from("motm_votes").upsert(
        {
          match_id: matchId,
          user_id: user.id,
          player_key: motmKey,
          player_name: players.get(motmKey)!.name,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" },
      )
    : await supabase.from("motm_votes").delete().eq("match_id", matchId).eq("user_id", user.id);
  if (motmResult.error) return { ok: false, error: motmResult.error.message };

  revalidateTag("fan-ratings", { expire: 0 });
  revalidatePath(`/simulation/${matchId}`);
  revalidatePath("/pronostics");
  return { ok: true };
}
