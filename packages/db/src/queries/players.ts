import { eq, sql } from "drizzle-orm";
import { createDb } from "../client";
import { clubs, players } from "../schema";

export interface PlayerView {
  id: string;
  jerseyNumber: number | null;
  name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  positionLabel: string;
  age: number;
  marketValue: number | null;
  matchesPlayed: number;
  goals: number;
  assists: number;
}

const OM_CLUB_NAME = "Olympique de Marseille";

function playerSelectFields() {
  return {
    id: players.id,
    jerseyNumber: players.jerseyNumber,
    name: players.name,
    position: players.position,
    positionLabel: players.positionLabel,
    age: players.age,
    marketValue: players.marketValue,
    matchesPlayed: players.matchesPlayed,
    goals: players.goals,
    assists: players.assists,
  };
}

export async function getSquad(
  db: ReturnType<typeof createDb>,
  clubName = OM_CLUB_NAME,
): Promise<PlayerView[]> {
  return db
    .select(playerSelectFields())
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .where(eq(clubs.name, clubName))
    .orderBy(sql`${players.marketValue} DESC NULLS LAST`);
}

export async function getCoach(
  db: ReturnType<typeof createDb>,
  clubName = OM_CLUB_NAME,
): Promise<string | null> {
  const [row] = await db
    .select({ coach: clubs.coach })
    .from(clubs)
    .where(eq(clubs.name, clubName))
    .limit(1);

  return row?.coach ?? null;
}

export async function getSquadTotalMarketValue(
  db: ReturnType<typeof createDb>,
  clubName = OM_CLUB_NAME,
): Promise<number> {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${players.marketValue}), 0)`.mapWith(Number),
    })
    .from(players)
    .innerJoin(clubs, eq(players.clubId, clubs.id))
    .where(eq(clubs.name, clubName));

  return row?.total ?? 0;
}
