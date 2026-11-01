import {
  integer,
  numeric,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { matches } from "./core";

// Pronostics & notes — écrits par les supporters via Supabase (RLS), points posés par la sync.

export const predictions = pgTable(
  "predictions",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    homeScore: smallint("home_score").notNull(),
    awayScore: smallint("away_score").notNull(),
    points: smallint("points"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("predictions_match_id_user_id_key").on(table.matchId, table.userId)],
);

export const playerRatings = pgTable(
  "player_ratings",
  {
    id: serial("id").primaryKey(),
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    playerKey: text("player_key").notNull(),
    playerName: text("player_name").notNull(),
    rating: numeric("rating", { precision: 3, scale: 1 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("player_ratings_match_id_user_id_player_key_key").on(
      table.matchId,
      table.userId,
      table.playerKey,
    ),
  ],
);

export const motmVotes = pgTable(
  "motm_votes",
  {
    matchId: integer("match_id")
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
    playerKey: text("player_key").notNull(),
    playerName: text("player_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.matchId, table.userId] })],
);
