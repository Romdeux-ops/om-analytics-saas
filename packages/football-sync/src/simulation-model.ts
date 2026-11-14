import { createHash } from "node:crypto";
import { appendPredictionLog, getSimulationParams, upsertSimulationParams, type Db, type PredictionLogEntry } from "@om/db";
import type { ModelParams } from "@om/match-model";
import { BACKTEST_COMPONENTS, BACKTEST_HEADLINE, buildModelParams, hyperSignature, seasonHyper } from "@om/match-model/fit";
import { loadHistory } from "@om/match-model/history";
import { fetchLigue1Season, type Ligue1SeasonMatch } from "./football-data";

export const SIMULATION_PARAMS_KEY = "ligue1";
const OM = "Marseille";

/** Les 18 clubs attendus : un nom inconnu signale un alias manquant, on préfère échouer que mal ajuster. */
const LIGUE1_CLUBS = 18;

export const seasonCode = (startYear: number) => `${String(startYear % 100).padStart(2, "0")}${String((startYear + 1) % 100).padStart(2, "0")}`;

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

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
  const code = seasonCode(seasonYear);
  // Hyperparamètres gelés pour toute la saison : ils ne suivent pas le dernier backtest.
  const frozen = seasonHyper(code);
  return buildModelParams({
    history: loadHistory(),
    season: code,
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
    hyper: frozen.hyper,
    hyperInfo: { season: code, frozenAt: frozen.frozenAt, signature: hyperSignature(frozen.hyper) },
    components: BACKTEST_COMPONENTS,
    backtest: BACKTEST_HEADLINE,
    now,
  });
}

/** Empreinte de ce qui détermine les prédictions : niveau de ligue, forces des clubs, hyperparamètres. */
export function paramsHash(params: ModelParams): string {
  return sha256(canonicalJson({ league: params.league, teams: params.teams, hyper: params.hyper?.signature ?? null }));
}

/** JSON à clés triées : un jsonb relu depuis Postgres ne conserve pas l'ordre des clés, l'empreinte doit y être insensible. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    return `{${entries.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

/**
 * Lignes du journal prospectif : une par affiche de Ligue 1 de la journée encore à jouer
 * (les 9 de la journée, pas seulement l'OM), rattachée à son identifiant football-data.org.
 */
export function buildLogEntries(params: ModelParams, season: readonly Ligue1SeasonMatch[], seasonYear: number): PredictionLogEntry[] {
  const hash = paramsHash(params);
  const hyperHash = sha256(params.hyper?.signature ?? "non gelé");
  return params.fixtures.flatMap((f) => {
    const match = season.find((m) => m.home === f.home && m.away === f.away);
    if (!match || match.played) return [];
    return [
      {
        matchId: String(match.id),
        season: seasonCode(seasonYear),
        matchday: match.matchday,
        homeTeam: f.home,
        awayTeam: f.away,
        // Coup d'envoi du calendrier à l'instant de l'écriture (il peut différer de celui du JSON après un report).
        kickoff: new Date(match.date),
        paramsHash: hash,
        hyperHash,
        dataThrough: params.dataThrough || null,
        grid: f.grid,
        pHome: f.probabilities.home,
        pDraw: f.probabilities.draw,
        pAway: f.probabilities.away,
        probabilityInterval: f.interval,
        lambdaHome: f.lambdaHome,
        lambdaAway: f.lambdaAway,
      },
    ];
  });
}

/** Écrit dans le journal les prédictions pas encore consignées. Insertion seule ; matchs commencés refusés. */
export async function logPredictions(db: Db | null, params: ModelParams, season: readonly Ligue1SeasonMatch[], seasonYear: number): Promise<number> {
  const entries = buildLogEntries(params, season, seasonYear);
  if (!db) {
    console.log(`ℹ journal prospectif : ${entries.length} prédiction(s) à consigner (aucune écriture en dry run)`);
    return 0;
  }
  const { written, refused } = await appendPredictionLog(db, entries);
  console.log(
    `✓ journal prospectif : ${written} nouvelle(s) prédiction(s) sur ${entries.length} affiche(s)` +
      (refused.length ? `, ${refused.length} refusée(s) car le match a commencé` : ""),
  );
  return written;
}

/**
 * Régénère les paramètres du modèle quand de nouveaux résultats de Ligue 1 sont arrivés
 * (match de l'OM compris) ou quand la journée à prédire a changé. Appelé à chaque synchro :
 * le rattrapage quotidien des autres clubs est donc automatique. Renvoie true s'il a écrit.
 *
 * Dans tous les cas, les prédictions des affiches à venir sont consignées dans le journal prospectif.
 */
export async function refreshSimulationModel(db: Db | null, token: string, seasonYear: number, force = false): Promise<boolean> {
  const season = await fetchLigue1Season(token, seasonYear);
  const played = season.filter((m) => m.played).length;
  const matchday = nextOmMatchday(season)?.matchday ?? null;
  // Le journal ne doit jamais faire échouer la mise à jour des paramètres (table absente, par exemple).
  const log = async (params: ModelParams) => {
    try {
      await logPredictions(db, params, season, seasonYear);
    } catch (error) {
      console.warn("⚠ journal prospectif non écrit :", error);
    }
  };

  if (db && !force) {
    const existing = (await getSimulationParams(db, SIMULATION_PARAMS_KEY)) as ModelParams | null;
    const sameHyper = existing?.hyper?.signature === hyperSignature(seasonHyper(seasonCode(seasonYear)).hyper);
    if (existing && sameHyper && existing.seasonResults >= played && existing.matchday === matchday) {
      console.log(`✓ modèle de simulation : à jour (${played} matchs joués, journée ${matchday ?? "—"})`);
      await log(existing);
      return false;
    }
  }

  const params = buildParamsFromSeason(season, seasonYear);
  console.log(
    `✓ modèle de simulation : ${params.matchesUsed} matchs ajustés, données jusqu'au ${params.dataThrough}, ` +
      `journée ${params.matchday ?? "—"} (${params.fixtures.length} affiches à jouer, ${params.playedFixtures?.length ?? 0} déjà jouées)`,
  );
  if (!db) {
    await log(params);
    return false;
  }
  await upsertSimulationParams(db, SIMULATION_PARAMS_KEY, params);
  await log(params);
  return true;
}
