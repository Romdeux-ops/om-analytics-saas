import { sql } from "drizzle-orm";
import { createDb } from "../client";
import {
  footballSnapshots,
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
