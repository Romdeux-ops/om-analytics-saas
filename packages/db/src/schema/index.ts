export * from "./core";
export * from "./fan-zone";

import { relations } from "drizzle-orm";
import { clubs, matches, players } from "./core";
import { messages, pollOptions, polls, profiles, rooms, votes } from "./fan-zone";

export const clubsRelations = relations(clubs, ({ many }) => ({
  players: many(players),
  homeMatches: many(matches, { relationName: "homeTeam" }),
  awayMatches: many(matches, { relationName: "awayTeam" }),
}));

export const playersRelations = relations(players, ({ one }) => ({
  club: one(clubs, {
    fields: [players.clubId],
    references: [clubs.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  homeTeam: one(clubs, {
    fields: [matches.homeTeamId],
    references: [clubs.id],
    relationName: "homeTeam",
  }),
  awayTeam: one(clubs, {
    fields: [matches.awayTeamId],
    references: [clubs.id],
    relationName: "awayTeam",
  }),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  messages: many(messages),
  polls: many(polls),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
}));

export const pollsRelations = relations(polls, ({ one, many }) => ({
  room: one(rooms, {
    fields: [polls.roomId],
    references: [rooms.id],
  }),
  options: many(pollOptions),
  votes: many(votes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  poll: one(polls, {
    fields: [votes.pollId],
    references: [polls.id],
  }),
  option: one(pollOptions, {
    fields: [votes.optionId],
    references: [pollOptions.id],
  }),
}));
