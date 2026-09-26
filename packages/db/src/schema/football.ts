import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type FootballCompetitionId = "ligue1" | "europa" | "coupe";

export interface SnapshotFixture {
  competition: FootballCompetitionId;
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  /** ISO 8601 avec offset Europe/Paris */
  date: string;
  timeTbd: boolean;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
}

export type SnapshotStandingZone =
  | "champions-league"
  | "europa-league"
  | "conference-league"
  | "relegation"
  | "playoffs-direct"
  | "playoffs-qualifiers";

export interface SnapshotStanding {
  rank: number;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  zone?: SnapshotStandingZone;
}

/** Dernier état synchronisé (calendrier OM + classement) par compétition. */
export const footballSnapshots = pgTable("football_snapshots", {
  competition: text("competition").$type<FootballCompetitionId>().primaryKey(),
  fixtures: jsonb("fixtures").$type<SnapshotFixture[]>().notNull().default([]),
  standings: jsonb("standings").$type<SnapshotStanding[]>().notNull().default([]),
  source: text("source").notNull(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});
