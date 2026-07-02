import { asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { createDb } from "../client";
import { clubs, matches, players, type MatchEvent } from "../schema";
import {
  calculateTeamStrength,
  MatchSimulator,
} from "../simulator";

const homeTeam = alias(clubs, "home_team");
const awayTeam = alias(clubs, "away_team");

export interface MatchView {
  id: number;
  home_team_name: string;
  away_team_name: string;
  match_log: MatchEvent[];
  played: boolean;
  home_score: number;
  away_score: number;
}

export async function getMatchById(
  db: ReturnType<typeof createDb>,
  id: number,
): Promise<MatchView | null> {
  const [row] = await db
    .select({
      id: matches.id,
      home_team_name: homeTeam.name,
      away_team_name: awayTeam.name,
      match_log: matches.matchLog,
      played: matches.played,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(eq(matches.id, id))
    .limit(1);

  return row ?? null;
}

export async function getFirstUnplayedMatch(
  db: ReturnType<typeof createDb>,
): Promise<MatchView | null> {
  const [row] = await db
    .select({
      id: matches.id,
      home_team_name: homeTeam.name,
      away_team_name: awayTeam.name,
      match_log: matches.matchLog,
      played: matches.played,
      home_score: matches.homeScore,
      away_score: matches.awayScore,
    })
    .from(matches)
    .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(eq(matches.played, false))
    .orderBy(asc(matches.date))
    .limit(1);

  return row ?? null;
}

export async function simulateMatch(
  db: ReturnType<typeof createDb>,
  matchId: number,
): Promise<{ details: MatchView } | { error: string }> {
  const match = await getMatchById(db, matchId);

  if (!match) {
    return { error: "Match introuvable" };
  }

  if (match.played) {
    return { error: "Match déjà joué !" };
  }

  const [matchRow] = await db
    .select({
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!matchRow) {
    return { error: "Match introuvable" };
  }

  const squad = await db
    .select({
      clubId: players.clubId,
      overallRating: players.overallRating,
      formFactor: players.formFactor,
    })
    .from(players)
    .where(
      inArray(players.clubId, [matchRow.homeTeamId, matchRow.awayTeamId]),
    );

  const homePlayers = squad.filter((p) => p.clubId === matchRow.homeTeamId);
  const awayPlayers = squad.filter((p) => p.clubId === matchRow.awayTeamId);

  const simulator = new MatchSimulator(
    {
      name: match.home_team_name,
      strength: calculateTeamStrength(homePlayers),
    },
    {
      name: match.away_team_name,
      strength: calculateTeamStrength(awayPlayers),
    },
  );

  const result = simulator.simulateMatch();

  await db
    .update(matches)
    .set({
      homeScore: result.final_score.home,
      awayScore: result.final_score.away,
      matchLog: result.timeline,
      played: true,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId));

  const updated = await getMatchById(db, matchId);
  if (!updated) {
    return { error: "Erreur lors de la mise à jour du match" };
  }

  return { details: updated };
}
