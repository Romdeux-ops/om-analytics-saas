import { unstable_cache } from "next/cache";
import {
  getMatchCustomization,
  getMatchesByIds,
  getMatchesKickingOffBetween,
  type MatchView,
} from "@om/db";
import { getAuthUser } from "@/src/lib/auth/session";
import { getAllOmFixtures } from "@/src/lib/data/calendar";
import { getMatchLineups, resolveTeamName } from "@/src/lib/data/lineup";
import { applyCustomLineup } from "@/src/lib/data/match-presentation";
import { getDb } from "@/src/lib/db";
import { createClient } from "@/src/lib/supabase/server";
import { createPublicClient } from "@/src/lib/supabase/public";
import type { MatchLineups } from "@/src/lib/types/lineup";
import { LEADERBOARD_SIZE, RATING_CLOSES_AFTER_MS, RATING_OPENS_AFTER_MS } from "./constants";
import { normalizePlayerName, rateablePlayersFromLineups } from "./rateable";
import type {
  FanSeasonRating,
  LeaderboardEntry,
  MatchCommunityData,
  MatchPredictionData,
  MatchRatingsData,
  MatchToRate,
  MotmSummary,
  PlayerRatingSummary,
  PredictionDistribution,
  PredictionHistoryItem,
  RateablePlayer,
  Scoreline,
} from "./types";
import { hasKickedOff, ratingWindow, ratingWindowBounds, seasonStart } from "./window";

const HOUR = 60 * 60 * 1000;

type ResultLookup = (homeTeam: string, awayTeam: string) => Scoreline | null;

/** Résultats réels issus des snapshots football (le score de `matches` peut être simulé). */
async function buildResultLookup(): Promise<ResultLookup> {
  const fixtures = await getAllOmFixtures();
  const results = new Map<string, Scoreline>();
  for (const f of fixtures) {
    if (!f.played || f.homeScore == null || f.awayScore == null) continue;
    results.set(`${resolveTeamName(f.homeTeam)}|${resolveTeamName(f.awayTeam)}`, {
      home: f.homeScore,
      away: f.awayScore,
    });
  }
  return (homeTeam, awayTeam) =>
    results.get(`${resolveTeamName(homeTeam)}|${resolveTeamName(awayTeam)}`) ?? null;
}

function warn(scope: string, error: { message: string } | null | undefined) {
  if (error) console.warn(`[predictions] ${scope} :`, error.message);
}

interface DistributionRow {
  total: number;
  home_win: number;
  draw: number;
  away_win: number;
  top_home_score: number | null;
  top_away_score: number | null;
  top_count: number;
}

function toDistribution(row: DistributionRow | undefined): PredictionDistribution | null {
  if (!row) return null;
  const total = Number(row.total);
  return {
    total,
    homeWin: Number(row.home_win),
    draw: Number(row.draw),
    awayWin: Number(row.away_win),
    topScore:
      total > 0 && row.top_home_score != null && row.top_away_score != null
        ? { home: row.top_home_score, away: row.top_away_score, count: Number(row.top_count) }
        : null,
  };
}

export async function getMatchPredictionData(
  match: MatchView,
  userId: string | undefined,
): Promise<MatchPredictionData> {
  const supabase = await createClient();
  const kickedOff = hasKickedOff(match.date);

  const [mineRes, distributionRes, lookup] = await Promise.all([
    userId
      ? supabase
          .from("predictions")
          .select("home_score, away_score, points")
          .eq("match_id", match.id)
          .eq("user_id", userId)
          .maybeSingle()
      : null,
    kickedOff ? supabase.rpc("prediction_distribution", { p_match_id: match.id }) : null,
    kickedOff ? buildResultLookup() : null,
  ]);

  warn("prono", mineRes?.error);
  warn("répartition", distributionRes?.error);

  const mine = mineRes?.data;
  return {
    matchId: match.id,
    homeTeam: match.home_team_name,
    awayTeam: match.away_team_name,
    kickoff: new Date(match.date).toISOString(),
    isOpen: !kickedOff,
    mine: mine ? { home: mine.home_score, away: mine.away_score, points: mine.points } : null,
    distribution: toDistribution((distributionRes?.data as DistributionRow[] | null)?.[0]),
    result: lookup?.(match.home_team_name, match.away_team_name) ?? null,
  };
}

export async function getMatchRatingsData(
  match: MatchView,
  lineups: MatchLineups | null,
  userId: string | undefined,
): Promise<MatchRatingsData> {
  const window = ratingWindow(match.date);
  const { opensAt, closesAt } = ratingWindowBounds(match.date);
  const { teamName, players } = rateablePlayersFromLineups(lineups);

  const base: MatchRatingsData = {
    matchId: match.id,
    window,
    opensAt: opensAt.toISOString(),
    closesAt: closesAt.toISOString(),
    teamName,
    players,
    mine: {},
    myMotm: null,
    summary: [],
    motm: [],
  };
  if (window === "upcoming") return base;

  const supabase = await createClient();
  const [mineRes, myMotmRes, summaryRes, motmRes] = await Promise.all([
    userId
      ? supabase.from("player_ratings").select("player_key, rating").eq("match_id", match.id).eq("user_id", userId)
      : null,
    userId
      ? supabase
          .from("motm_votes")
          .select("player_key")
          .eq("match_id", match.id)
          .eq("user_id", userId)
          .maybeSingle()
      : null,
    supabase.rpc("player_rating_summary", { p_match_id: match.id }),
    supabase.rpc("motm_summary", { p_match_id: match.id }),
  ]);

  warn("mes notes", mineRes?.error);
  warn("mon homme du match", myMotmRes?.error);
  warn("moyennes", summaryRes.error);
  warn("homme du match", motmRes.error);

  const mine: Record<string, number> = {};
  for (const row of mineRes?.data ?? []) mine[row.player_key] = Number(row.rating);

  const summary: PlayerRatingSummary[] = (
    (summaryRes.data ?? []) as { player_key: string; player_name: string; avg_rating: number; votes: number }[]
  ).map((row) => ({
    key: row.player_key,
    name: row.player_name,
    average: Number(row.avg_rating),
    votes: Number(row.votes),
  }));

  const motm: MotmSummary[] = (
    (motmRes.data ?? []) as { player_key: string; player_name: string; votes: number }[]
  ).map((row) => ({ key: row.player_key, name: row.player_name, votes: Number(row.votes) }));

  return { ...base, mine, myMotm: myMotmRes?.data?.player_key ?? null, summary, motm };
}

export async function getMatchCommunityData(
  match: MatchView,
  lineups: MatchLineups | null,
): Promise<MatchCommunityData> {
  const user = await getAuthUser();
  const [prediction, ratings] = await Promise.all([
    getMatchPredictionData(match, user?.id),
    getMatchRatingsData(match, lineups, user?.id),
  ]);
  return { prediction, ratings };
}

/** Joueurs notables d'un match, recalculés côté serveur pour valider un vote. */
export async function getRateablePlayers(match: MatchView): Promise<RateablePlayer[]> {
  const [lineups, customization] = await Promise.all([
    getMatchLineups(resolveTeamName(match.home_team_name), resolveTeamName(match.away_team_name)).catch(
      () => null,
    ),
    getMatchCustomization(getDb(), match.id).catch(() => null),
  ]);
  return rateablePlayersFromLineups(applyCustomLineup(lineups, customization?.customLineup)).players;
}

export async function getLeaderboard(limit = LEADERBOARD_SIZE): Promise<LeaderboardEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("prediction_leaderboard", {
    p_since: seasonStart().toISOString(),
    p_limit: limit,
  });
  warn("classement", error);

  return (
    (data ?? []) as {
      user_id: string;
      display_name: string;
      avatar_url: string | null;
      total_points: number;
      exact_count: number;
      outcome_count: number;
      scored_count: number;
    }[]
  ).map((row, i) => ({
    rank: i + 1,
    userId: row.user_id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    totalPoints: Number(row.total_points),
    exactCount: Number(row.exact_count),
    outcomeCount: Number(row.outcome_count),
    scoredCount: Number(row.scored_count),
  }));
}

export async function getPredictionHistory(userId: string): Promise<PredictionHistoryItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("predictions")
    .select("match_id, home_score, away_score, points")
    .eq("user_id", userId);
  warn("historique", error);
  if (!data?.length) return [];

  const [matches, lookup] = await Promise.all([
    getMatchesByIds(
      getDb(),
      data.map((p) => p.match_id),
    ),
    buildResultLookup(),
  ]);
  const byMatch = new Map(data.map((p) => [p.match_id, p]));
  const since = seasonStart().getTime();

  return matches
    .filter((m) => new Date(m.date).getTime() >= since)
    .flatMap((m) => {
      const p = byMatch.get(m.id);
      if (!p) return [];
      return [
        {
          matchId: m.id,
          homeTeam: m.home_team_name,
          awayTeam: m.away_team_name,
          kickoff: new Date(m.date).toISOString(),
          prediction: { home: p.home_score, away: p.away_score, points: p.points },
          result: hasKickedOff(m.date) ? lookup(m.home_team_name, m.away_team_name) : null,
        },
      ];
    });
}

/** Prochain coup d'envoi à venir, d'après la date (le flag `played` peut venir d'une simulation). */
export async function getNextMatchToPredict(): Promise<MatchView | null> {
  const now = Date.now();
  const upcoming = await getMatchesKickingOffBetween(getDb(), new Date(now), new Date(now + 180 * 24 * HOUR));
  return upcoming.at(-1) ?? null;
}

/** Matchs dont la fenêtre de notation est ouverte en ce moment. */
export async function getMatchesToRate(userId: string | undefined): Promise<MatchToRate[]> {
  const now = Date.now();
  const matches = await getMatchesKickingOffBetween(
    getDb(),
    new Date(now - RATING_CLOSES_AFTER_MS),
    new Date(now - RATING_OPENS_AFTER_MS),
  );
  if (matches.length === 0) return [];

  let voted = new Set<number>();
  if (userId) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("player_ratings")
      .select("match_id")
      .eq("user_id", userId)
      .in(
        "match_id",
        matches.map((m) => m.id),
      );
    warn("matchs notés", error);
    voted = new Set((data ?? []).map((r) => r.match_id));
  }

  return matches.map((m) => ({
    matchId: m.id,
    homeTeam: m.home_team_name,
    awayTeam: m.away_team_name,
    kickoff: new Date(m.date).toISOString(),
    closesAt: ratingWindowBounds(m.date).closesAt.toISOString(),
    hasVoted: voted.has(m.id),
  }));
}

/** Moyenne des notes fans sur la saison, indexée par nom de joueur normalisé. */
export const getSeasonFanRatings = unstable_cache(
  async (): Promise<Record<string, FanSeasonRating>> => {
    const { data, error } = await createPublicClient().rpc("player_season_ratings", {
      p_since: seasonStart().toISOString(),
    });
    warn("notes saison", error);

    const ratings: Record<string, FanSeasonRating> = {};
    for (const row of (data ?? []) as {
      player_name: string;
      avg_rating: number;
      votes: number;
      matches_rated: number;
    }[]) {
      ratings[normalizePlayerName(row.player_name)] = {
        average: Number(row.avg_rating),
        votes: Number(row.votes),
        matchesRated: Number(row.matches_rated),
      };
    }
    return ratings;
  },
  ["fan-season-ratings"],
  { revalidate: 300, tags: ["fan-ratings"] },
);
