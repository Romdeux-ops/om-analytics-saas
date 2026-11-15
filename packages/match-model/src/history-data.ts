import file from "../data/ligue1-history.json";
import { decodeHistory, type HistoryFile, type HistoryMatch } from "./history";

/** Historique de référence versionné dans le dépôt (régénéré par `bun run model:ingest`). */
export function loadHistory(): HistoryMatch[] {
  return decodeHistory(file as unknown as HistoryFile);
}

export const HISTORY_GENERATED_AT: string = (file as unknown as HistoryFile).generatedAt;
