import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { createDb } from "../client";
import {
  footballSnapshots,
  predictionLog,
  simulationParams,
  type PredictionInterval,
  type FootballCompetitionId,
  type SnapshotFixture,
  type SnapshotStanding,
} from "../schema";

export interface FootballSnapshot {
  competition: FootballCompetitionId;
  fixtures: SnapshotFixture[];
  standings: SnapshotStanding[];
  source: string;
  syncedAt: string;
}

export async function getFootballSnapshots(
  db: ReturnType<typeof createDb>,
): Promise<FootballSnapshot[]> {
  const rows = await db.select().from(footballSnapshots);
  return rows.map((row) => ({ ...row, syncedAt: row.syncedAt.toISOString() }));
}

export async function upsertFootballSnapshot(
  db: ReturnType<typeof createDb>,
  snapshot: Omit<FootballSnapshot, "syncedAt">,
): Promise<void> {
  await db
    .insert(footballSnapshots)
    .values(snapshot)
    .onConflictDoUpdate({
      target: footballSnapshots.competition,
      set: {
        fixtures: snapshot.fixtures,
        standings: snapshot.standings,
        source: snapshot.source,
        syncedAt: sql`now()`,
      },
    });
}

export async function getSimulationParams(db: ReturnType<typeof createDb>, key: string): Promise<unknown | null> {
  const rows = await db.select().from(simulationParams).where(eq(simulationParams.key, key)).limit(1);
  return rows[0]?.params ?? null;
}

export async function upsertSimulationParams(db: ReturnType<typeof createDb>, key: string, params: unknown): Promise<void> {
  await db
    .insert(simulationParams)
    .values({ key, params })
    .onConflictDoUpdate({ target: simulationParams.key, set: { params, generatedAt: sql`now()` } });
}

export interface PredictionLogEntry {
  matchId: string;
  season: string;
  matchday: number;
  homeTeam: string;
  awayTeam: string;
  kickoff: Date;
  paramsHash: string;
  hyperHash: string;
  /** Commit Git du code qui a produit la prédiction. */
  codeCommit: string;
  dataThrough: string | null;
  grid: number[][];
  pHome: number;
  pDraw: number;
  pAway: number;
  probabilityInterval: PredictionInterval;
  lambdaHome: number;
  lambdaAway: number;
}

export interface PredictionLogRow extends PredictionLogEntry {
  id: number;
  writtenAt: Date;
}

/**
 * Ajoute des prédictions au journal prospectif. Insertion seule : une prédiction déjà écrite
 * (même match, mêmes paramètres, même coup d'envoi) est ignorée, rien n'est jamais écrasé.
 * Les matchs déjà commencés sont écartés ici et, de toute façon, refusés par la base.
 */
export async function appendPredictionLog(
  db: ReturnType<typeof createDb>,
  entries: readonly PredictionLogEntry[],
  now: Date = new Date(),
): Promise<{ written: number; refused: PredictionLogEntry[] }> {
  const refused = entries.filter((e) => e.kickoff.getTime() <= now.getTime());
  const open = entries.filter((e) => e.kickoff.getTime() > now.getTime());
  if (open.length === 0) return { written: 0, refused };
  const inserted = await db.insert(predictionLog).values(open).onConflictDoNothing().returning({ id: predictionLog.id });
  return { written: inserted.length, refused };
}

/** Lignes déjà consignées pour un jeu de paramètres donné, parmi les matchs indiqués (contrôle de complétude). */
export async function getPredictionLogFor(
  db: ReturnType<typeof createDb>,
  paramsHash: string,
  matchIds: readonly string[],
): Promise<{ matchId: string; kickoff: Date }[]> {
  if (matchIds.length === 0) return [];
  return db
    .select({ matchId: predictionLog.matchId, kickoff: predictionLog.kickoff })
    .from(predictionLog)
    .where(and(eq(predictionLog.paramsHash, paramsHash), inArray(predictionLog.matchId, [...matchIds])));
}

/** Lecture du journal d'une saison, dans l'ordre d'écriture. */
export async function getPredictionLog(db: ReturnType<typeof createDb>, season: string): Promise<PredictionLogRow[]> {
  return db.select().from(predictionLog).where(eq(predictionLog.season, season)).orderBy(asc(predictionLog.writtenAt), asc(predictionLog.id));
}
