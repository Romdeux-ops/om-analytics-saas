import {
  bigint,
  boolean,
  integer,
  jsonb,
  real,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const clubs = pgTable("clubs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  budgetTransfert: bigint("budget_transfert", { mode: "number" })
    .notNull()
    .default(0),
  masseSalarialeActuelle: bigint("masse_salariale_actuelle", {
    mode: "number",
  })
    .notNull()
    .default(0),
  plafondSalarialDncg: bigint("plafond_salarial_dncg", { mode: "number" })
    .notNull()
    .default(0),
  reputation: integer("reputation").notNull().default(50),
  coach: text("coach"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const playerPositionEnum = pgEnum("player_position", [
  "GK",
  "DEF",
  "MID",
  "FWD",
]);

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  clubId: integer("club_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: playerPositionEnum("position").notNull(),
  positionLabel: text("position_label").notNull().default(""),
  jerseyNumber: integer("jersey_number"),
  age: integer("age").notNull().default(0),
  overallRating: integer("overall_rating").notNull(),
  formFactor: real("form_factor").notNull().default(1.0),
  injuryProne: real("injury_prone").notNull().default(0.1),
  marketValue: bigint("market_value", { mode: "number" }),
  wage: bigint("wage", { mode: "number" }).notNull(),
  matchesPlayed: integer("matches_played").notNull().default(0),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MatchEvent = {
  minute: number;
  type: string;
  description: string;
  current_score: { home: number; away: number };
};

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  homeTeamId: integer("home_team_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  awayTeamId: integer("away_team_id")
    .notNull()
    .references(() => clubs.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  played: boolean("played").notNull().default(false),
  homeScore: integer("home_score").notNull().default(0),
  awayScore: integer("away_score").notNull().default(0),
  matchLog: jsonb("match_log").$type<MatchEvent[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
