import {
  createDb,
  deleteUnlistedPressArticles,
  getNewsItemsSince,
  PRESS_MENU_KEEP,
  pruneStalePressArticles,
  replaceAutoNewsItems,
  upsertFootballSnapshot,
  upsertNewsItems,
  type Db,
  type FootballCompetitionId,
  type SnapshotFixture,
  type SnapshotStanding,
} from "@om/db";
import { buildAutoNews, type CompetitionData } from "./auto-news";
import { currentSeasonYear } from "./dates";
import { europaZone, fetchEspnFixtures, fetchEspnStandings } from "./espn";
import { fetchLigue1 } from "./football-data";
import { fetchPressArticles } from "./news";

const DAY = 24 * 60 * 60 * 1000;
/** Fenêtre de comparaison pour écarter une info déjà publiée par une autre source. */
const DEDUPE_WINDOW = 14 * DAY;
const NEWS_RETENTION = 14 * DAY;

interface SyncJob {
  competition: FootballCompetitionId;
  source: string;
  /** Une compétition sans match (tirage à venir) n'écrase pas les données existantes. */
  allowEmpty: boolean;
  run: () => Promise<{ fixtures: SnapshotFixture[]; standings: SnapshotStanding[] }>;
}

const dryRun = process.argv.includes("--dry-run");
const pressOnly = process.argv.includes("--press-only");
const seasonYear = currentSeasonYear();

function buildJobs(): SyncJob[] {
  const jobs: SyncJob[] = [];
  const token = process.env.FOOTBALL_DATA_TOKEN;

  jobs.push({
    competition: "ligue1",
    source: "football-data.org",
    allowEmpty: false,
    run: () =>
      token
        ? fetchLigue1(token, seasonYear)
        : Promise.reject(new Error("FOOTBALL_DATA_TOKEN absent : Ligue 1 non synchronisée.")),
  });

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

/** Actus générées depuis les résultats. Sans Ligue 1 fraîche, on garde les précédentes. */
async function syncAutoNews(
  db: Db | null,
  data: Partial<Record<FootballCompetitionId, CompetitionData>>,
): Promise<number> {
  const autoNews = buildAutoNews(data);
  console.log(`✓ actus générées : ${autoNews.length}`);
  if (!db || !data.ligue1) return 0;
  await replaceAutoNewsItems(db, autoNews);
  return autoNews.length;
}

/**
 * Presse uniquement. Aucun article de qualité trouvé : on n'écrit rien.
 * Le hors-liste est retiré ; un article ancien n'est purgé que s'il reste assez de plus récents.
 */
async function syncPress(db: Db | null): Promise<number> {
  const since = new Date(Date.now() - DEDUPE_WINDOW);
  const existing = db ? await getNewsItemsSince(db, since) : [];
  const articles = await fetchPressArticles(existing, since);
  console.log(`✓ presse : ${articles.length} nouveaux articles`);

  if (!db) {
    console.log(JSON.stringify({ articles: articles.slice(-3) }, null, 2));
    return 0;
  }

  if (articles.length > 0) await upsertNewsItems(db, articles);
  const removed = await deleteUnlistedPressArticles(db);
  const pruned = await pruneStalePressArticles(db, new Date(Date.now() - NEWS_RETENTION), PRESS_MENU_KEEP);
  if (removed > 0 || pruned > 0) {
    console.log(`✓ presse : ${removed} hors liste retirés, ${pruned} articles anciens purgés`);
  }
  return articles.length + removed + pruned;
}

async function main() {
  const db = dryRun ? null : createDb();

  if (pressOnly) {
    console.log(`Synchronisation presse${dryRun ? " (dry run)" : ""}`);
    let failures = 0;
    let written = 0;
    try {
      written = await syncPress(db);
    } catch (error) {
      failures++;
      console.error("✗ presse :", error);
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

  console.log(`Synchronisation football — saison ${seasonYear}-${seasonYear + 1}${dryRun ? " (dry run)" : ""}`);
  const jobs = buildJobs();
  const competitionData: Partial<Record<FootballCompetitionId, CompetitionData>> = {};
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

    competitionData[job.competition] = { fixtures, standings };

    if (dryRun) {
      console.log(JSON.stringify({ fixtures: fixtures.slice(0, 3), standings: standings.slice(0, 3) }, null, 2));
      continue;
    }

    await upsertFootballSnapshot(db!, { competition: job.competition, fixtures, standings, source: job.source });
    written++;
  }

  try {
    written += await syncAutoNews(db, competitionData);
  } catch (error) {
    failures++;
    console.error("✗ actus générées :", error);
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
