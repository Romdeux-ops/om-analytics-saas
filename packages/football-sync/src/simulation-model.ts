import { getSimulationParams, upsertSimulationParams, type Db } from "@om/db";
import type { ModelParams } from "@om/match-model";
import { BACKTEST_COMPONENTS, BACKTEST_HEADLINE, SELECTED_HYPER, buildModelParams } from "@om/match-model/fit";
import { loadHistory } from "@om/match-model/history";
import { fetchLigue1Season, type Ligue1SeasonMatch } from "./football-data";

export const SIMULATION_PARAMS_KEY = "ligue1";
const OM = "Marseille";

/** Les 18 clubs attendus : un nom inconnu signale un alias manquant, on préfère échouer que mal ajuster. */
const LIGUE1_CLUBS = 18;

const seasonCode = (startYear: number) => `${String(startYear % 100).padStart(2, "0")}${String((startYear + 1) % 100).padStart(2, "0")}`;

/** Journée du prochain match de Ligue 1 de l'OM, et toutes les affiches réelles de cette journée. */
export function nextOmMatchday(season: readonly Ligue1SeasonMatch[]): { matchday: number; fixtures: Ligue1SeasonMatch[] } | null {
  const next = season
    .filter((m) => !m.played && (m.home === OM || m.away === OM))
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (!next) return null;
  return { matchday: next.matchday, fixtures: season.filter((m) => m.matchday === next.matchday) };
}

export function buildParamsFromSeason(season: readonly Ligue1SeasonMatch[], seasonYear: number, now = new Date()): ModelParams {
  const clubs = [...new Set(season.flatMap((m) => [m.home, m.away]))];
  if (clubs.length !== LIGUE1_CLUBS) {
    throw new Error(`Calendrier de Ligue 1 : ${clubs.length} clubs au lieu de ${LIGUE1_CLUBS} (${clubs.sort().join(", ")})`);
  }
  const upcoming = nextOmMatchday(season);
  return buildModelParams({
    history: loadHistory(),
    season: seasonCode(seasonYear),
    results: season
      .filter((m) => m.played)
      .map((m) => ({ date: m.date, home: m.home, away: m.away, hg: m.homeScore!, ag: m.awayScore! })),
    // Un match de la journée déjà joué garde son score réel : il n'est ni prédit ni simulé.
    fixtures: upcoming?.fixtures.map((m) => ({
      matchday: m.matchday,
      date: m.date,
      home: m.home,
      away: m.away,
      ...(m.played ? { result: { home: m.homeScore!, away: m.awayScore! } } : {}),
    })),
    matchday: upcoming?.matchday ?? null,
    teams: clubs,
    hyper: SELECTED_HYPER,
    components: BACKTEST_COMPONENTS,
    backtest: BACKTEST_HEADLINE,
    now,
  });
}

/**
 * Régénère les paramètres du modèle quand de nouveaux résultats de Ligue 1 sont arrivés
 * (match de l'OM compris) ou quand la journée à prédire a changé. Appelé à chaque synchro :
 * le rattrapage quotidien des autres clubs est donc automatique. Renvoie true s'il a écrit.
 */
export async function refreshSimulationModel(db: Db | null, token: string, seasonYear: number, force = false): Promise<boolean> {
  const season = await fetchLigue1Season(token, seasonYear);
  const played = season.filter((m) => m.played).length;
  const matchday = nextOmMatchday(season)?.matchday ?? null;

  if (db && !force) {
    const existing = (await getSimulationParams(db, SIMULATION_PARAMS_KEY)) as ModelParams | null;
    if (existing && existing.seasonResults >= played && existing.matchday === matchday) {
      console.log(`✓ modèle de simulation : à jour (${played} matchs joués, journée ${matchday ?? "—"})`);
      return false;
    }
  }

  const params = buildParamsFromSeason(season, seasonYear);
  console.log(
    `✓ modèle de simulation : ${params.matchesUsed} matchs ajustés, données jusqu'au ${params.dataThrough}, ` +
      `journée ${params.matchday ?? "—"} (${params.fixtures.length} affiches à jouer, ${params.playedFixtures?.length ?? 0} déjà jouées)`,
  );
  if (!db) return false;
  await upsertSimulationParams(db, SIMULATION_PARAMS_KEY, params);
  return true;
}
