export { createDb, type Db } from "./client";
export * from "./schema";
export {
  getMatchById,
  getFirstUnplayedMatch,
  simulateMatch,
  type MatchView,
} from "./queries/matches";
