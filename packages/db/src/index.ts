export { createDb, type Db } from "./client";
export * from "./schema";
export { eq, and, asc, desc, inArray, or } from "drizzle-orm";
export { currentSeasonYear, formatSeason } from "./season";
export {
  getMatchById,
  getMatchesByIds,
  getMatchesKickingOffBetween,
  getFirstUnplayedMatch,
  getUpcomingMatches,
  getNextOmMatch,
  simulateMatch,
  getMatchCustomization,
  upsertMatchCustomization,
  type MatchView,
  type MatchCustomizationData,
} from "./queries/matches";
export {
  getSquad,
  getCoach,
  getSquadTotalMarketValue,
  getSquadPageData,
  type PlayerView,
  type SquadPageData,
} from "./queries/players";
export {
  getFootballSnapshots,
  upsertFootballSnapshot,
  type FootballSnapshot,
} from "./queries/football";
export {
  getLatestNewsItems,
  getNewsItemsByKind,
  getNewsItemsSince,
  upsertNewsItems,
  replaceAutoNewsItems,
  deleteUnlistedPressArticles,
  deleteExcludedPressArticles,
  pruneStalePressArticles,
  type NewsItemRecord,
} from "./queries/news";
export { scoreMatchPredictions } from "./queries/predictions";
export { PREDICTION_POINTS, predictionPoints, type Scoreline } from "./prediction-points";
export {
  isQualityPressSource,
  isExcludedPressTitle,
  pickDistinctPress,
  titlesAreSimilar,
  PRESS_MENU_KEEP,
} from "./news-quality";
