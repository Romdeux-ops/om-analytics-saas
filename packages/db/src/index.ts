export { createDb, type Db } from "./client";
export * from "./schema";
export {
  getMatchById,
  getFirstUnplayedMatch,
  getUpcomingMatches,
  getNextOmMatch,
  simulateMatch,
  type MatchView,
} from "./queries/matches";
export {
  getSquad,
  getCoach,
  getSquadTotalMarketValue,
  type PlayerView,
} from "./queries/players";
