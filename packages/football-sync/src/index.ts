import {
  createDb,
  upsertFootballSnapshot,
  type FootballCompetitionId,
  type SnapshotFixture,
  type SnapshotStanding,
} from "@om/db";
import { currentSeasonYear } from "./dates";
import { europaZone, fetchEspnFixtures, fetchEspnStandings } from "./espn";
import { fetchLigue1 } from "./football-data";

interface SyncJob {
  competition: FootballCompetitionId;
  source: string;
  /** Une compétition sans match (tirage à venir) n'écrase pas les données existantes. */
  allowEmpty: boolean;
  run: () => Promise<{ fixtures: SnapshotFixture[]; standings: SnapshotStanding[] }>;
}

const dryRun = process.argv.includes("--dry-run");
const seasonYear = currentSeasonYear();

function buildJobs(): SyncJob[] {
  const jobs: SyncJob[] = [];
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (token) {
    jobs.push({
      competition: "ligue1",
      source: "football-data.org",
      allowEmpty: false,
      run: () => fetchLigue1(token, seasonYear),
    });
  } else {
    console.warn("⚠ FOOTBALL_DATA_TOKEN absent : Ligue 1 ignorée.");
  }

  jobs.push(
    {
      competition: "europa",
      source: "espn",
      allowEmpty: false,
      run: async () => {
        const [fixtures, standings] = await Promise.all([
          fetchEspnFixtures("europa", seasonYear),
          fetchEspnStandings("europa", seasonYear, europaZone),
        ]);
        return { fixtures, standings };
      },
    },
    {
      competition: "coupe",
      source: "espn",
      allowEmpty: true,
      run: async () => ({ fixtures: await fetchEspnFixtures("coupe", seasonYear), standings: [] }),
    },
  );

  return jobs;
}

async function triggerRevalidation(): Promise<void> {
  const siteUrl = process.env.SITE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!siteUrl || !secret) {
    console.log("ℹ SITE_URL/REVALIDATE_SECRET absents : le site se mettra à jour au prochain cycle de cache (5 min).");
    return;
  }
  const res = await fetch(new URL("/api/revalidate/football", siteUrl), {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!res.ok) throw new Error(`Revalidation → HTTP ${res.status}`);
  console.log("✓ Cache du site invalidé.");
}

async function main() {
  console.log(`Synchronisation football — saison ${seasonYear}-${seasonYear + 1}${dryRun ? " (dry run)" : ""}`);

  const db = dryRun ? null : createDb();
  const jobs = buildJobs();
  let failures = 0;
  let written = 0;

  const results = await Promise.allSettled(jobs.map((job) => job.run()));

  for (const [index, result] of results.entries()) {
    const job = jobs[index];
    if (result.status === "rejected") {
      failures++;
      console.error(`✗ ${job.competition} (${job.source}) :`, result.reason);
      continue;
    }

    const { fixtures, standings } = result.value;
    const played = fixtures.filter((f) => f.played).length;
    console.log(
      `✓ ${job.competition} : ${fixtures.length} matchs (${played} joués), ${standings.length} lignes de classement`,
    );

    if (fixtures.length === 0) {
      if (!job.allowEmpty) {
        failures++;
        console.error(`✗ ${job.competition} : aucun match renvoyé, données existantes conservées.`);
      }
      continue;
    }

    if (dryRun) {
      console.log(JSON.stringify({ fixtures: fixtures.slice(0, 3), standings: standings.slice(0, 3) }, null, 2));
      continue;
    }

    await upsertFootballSnapshot(db!, { competition: job.competition, fixtures, standings, source: job.source });
    written++;
  }

  if (written > 0) {
    try {
      await triggerRevalidation();
    } catch (error) {
      failures++;
      console.error("✗ Revalidation du site :", error);
    }
  }

  process.exit(failures > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
