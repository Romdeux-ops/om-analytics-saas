import { bigint, date, doublePrecision, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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

/**
 * Paramètres du modèle de prédiction (JSON produit hors ligne par `@om/match-model`).
 * Une ligne par clé (« ligue1 »). Le contenu est typé côté modèle, pas ici.
 */
export const simulationParams = pgTable("simulation_params", {
  key: text("key").primaryKey(),
  params: jsonb("params").$type<unknown>().notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).notNull().defaultNow(),
});

export interface PredictionInterval {
  home: [number, number];
  draw: [number, number];
  away: [number, number];
}

/**
 * Journal prospectif des prédictions de Ligue 1. Table en ECRITURE SEULE : des déclencheurs en base
 * refusent toute mise à jour, suppression ou vidage, ainsi que toute écriture après le coup d'envoi.
 * Il n'existe volontairement aucune fonction de modification dans ce paquet.
 */
export const predictionLog = pgTable("prediction_log", {
  id: bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
  matchId: text("match_id").notNull(),
  season: text("season").notNull(),
  matchday: integer("matchday").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  kickoff: timestamp("kickoff", { withTimezone: true }).notNull(),
  writtenAt: timestamp("written_at", { withTimezone: true }).notNull().defaultNow(),
  paramsHash: text("params_hash").notNull(),
  hyperHash: text("hyper_hash").notNull(),
  codeCommit: text("code_commit").notNull(),
  dataThrough: date("data_through"),
  grid: jsonb("grid").$type<number[][]>().notNull(),
  pHome: doublePrecision("p_home").notNull(),
  pDraw: doublePrecision("p_draw").notNull(),
  pAway: doublePrecision("p_away").notNull(),
  probabilityInterval: jsonb("probability_interval").$type<PredictionInterval>().notNull(),
  lambdaHome: doublePrecision("lambda_home").notNull(),
  lambdaAway: doublePrecision("lambda_away").notNull(),
});
