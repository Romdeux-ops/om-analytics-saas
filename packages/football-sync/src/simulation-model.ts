import { execSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendPredictionLog, getPredictionLogFor, getSimulationParams, upsertSimulationParams, type Db, type PredictionLogEntry } from "@om/db";
import type { ModelParams } from "@om/match-model";
import { BACKTEST_COMPONENTS, BACKTEST_HEADLINE, buildModelParams, hyperSignature, predictFixtureFromParams, seasonHyper } from "@om/match-model/fit";
import { loadHistory } from "@om/match-model/history";
import { fetchLigue1Season, type Ligue1SeasonMatch } from "./football-data";

export const SIMULATION_PARAMS_KEY = "ligue1";
const OM = "Marseille";

/** Les 18 clubs attendus : un nom inconnu signale un alias manquant, on préfère échouer que mal ajuster. */
const LIGUE1_CLUBS = 18;

/** Le journal prospectif consigne toute affiche de Ligue 1 non jouée dont le coup d'envoi est dans cette fenêtre. */
export const LOG_WINDOW_DAYS = 14;
const DAY_MS = 86_400_000;

export const seasonCode = (startYear: number) => `${String(startYear % 100).padStart(2, "0")}${String((startYear + 1) % 100).padStart(2, "0")}`;

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex");

/** Journal prospectif incomplet ou inaccessible : fait échouer l'étape de synchro. */
export class PredictionLogError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PredictionLogError";
  }
}

/**
 * Commit Git du code en cours d'exécution : `GITHUB_SHA` dans le workflow, sinon `git rev-parse HEAD`.
 * Le code du modèle n'est pas gelé en cours de saison ; chaque prédiction garde donc la trace de sa version.
 */
export function currentCodeCommit(): string {
  const fromCi = process.env.GITHUB_SHA?.trim();
  if (fromCi) return fromCi;
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() || "inconnu";
  } catch {
    return "inconnu";
  }
}

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

/** Affiches à consigner : toute affiche de Ligue 1 non jouée dont le coup d'envoi est dans les 14 jours. */
export function fixturesToLog(season: readonly Ligue1SeasonMatch[], now: Date): Ligue1SeasonMatch[] {
  const from = now.getTime();
  const until = from + LOG_WINDOW_DAYS * DAY_MS;
  return season
    .filter((m) => {
      const kickoff = new Date(m.date).getTime();
      return !m.played && kickoff > from && kickoff <= until;
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Lignes du journal prospectif : une par affiche de Ligue 1 à venir dans les 14 jours, quelle que soit
 * sa journée. Les affiches de la journée en cours reprennent la prédiction affichée sur le site ; les
 * autres sont calculées depuis les mêmes paramètres, par la même formule.
 */
export function buildLogEntries(
  params: ModelParams,
  season: readonly Ligue1SeasonMatch[],
  seasonYear: number,
  now: Date = new Date(),
  codeCommit: string = currentCodeCommit(),
): PredictionLogEntry[] {
  const hash = paramsHash(params);
  const hyperHash = sha256(params.hyper?.signature ?? "non gelé");
  return fixturesToLog(season, now).map((match) => {
    const fixture = { matchday: match.matchday, date: match.date, home: match.home, away: match.away };
    const prediction = params.fixtures.find((f) => f.home === match.home && f.away === match.away) ?? predictFixtureFromParams(params, fixture);
    if (!prediction) throw new PredictionLogError(`Affiche ${match.home} – ${match.away} : club inconnu du modèle, prédiction impossible.`);
    return {
      matchId: String(match.id),
      season: seasonCode(seasonYear),
      matchday: match.matchday,
      homeTeam: match.home,
      awayTeam: match.away,
      // Coup d'envoi du calendrier à l'instant de l'écriture (il peut différer de celui du JSON après un report).
      kickoff: new Date(match.date),
      paramsHash: hash,
      hyperHash,
      codeCommit,
      dataThrough: params.dataThrough || null,
      grid: prediction.grid,
      pHome: prediction.probabilities.home,
      pDraw: prediction.probabilities.draw,
      pAway: prediction.probabilities.away,
      probabilityInterval: prediction.interval,
      lambdaHome: prediction.lambdaHome,
      lambdaAway: prediction.lambdaAway,
    };
  });
}

/**
 * Consigne les prédictions pas encore écrites, puis vérifie que le journal est complet : chaque affiche
 * attendue doit y avoir une ligne pour les paramètres courants. Insertion seule. Lève `PredictionLogError`
 * si une ligne manque ou si la table est inaccessible : la synchro échoue alors bruyamment.
 */
export async function logPredictions(
  db: Db | null,
  params: ModelParams,
  season: readonly Ligue1SeasonMatch[],
  seasonYear: number,
  now: Date = new Date(),
): Promise<{ written: number; expected: number; present: number }> {
  const entries = buildLogEntries(params, season, seasonYear, now);
  if (!db) {
    console.log(`ℹ journal prospectif : ${entries.length} affiche(s) à consigner dans les ${LOG_WINDOW_DAYS} jours (aucune écriture en dry run)`);
    return { written: 0, expected: entries.length, present: 0 };
  }
  let written: number;
  let present: number;
  let expected: PredictionLogEntry[];
  try {
    const result = await appendPredictionLog(db, entries, now);
    written = result.written;
    // Un match qui a commencé entre le calcul et l'écriture n'est plus attendu : il est refusé, pas manquant.
    expected = entries.filter((e) => !result.refused.includes(e));
    const rows = await getPredictionLogFor(db, entries[0]?.paramsHash ?? "", expected.map((e) => e.matchId));
    const logged = new Set(rows.map((r) => `${r.matchId}|${new Date(r.kickoff).getTime()}`));
    present = expected.filter((e) => logged.has(`${e.matchId}|${e.kickoff.getTime()}`)).length;
  } catch (error) {
    const e = error as { message?: string; cause?: { message?: string } };
    throw new PredictionLogError(`écriture impossible (${e.cause?.message ?? e.message ?? String(error)})`);
  }
  if (present < expected.length) {
    throw new PredictionLogError(`${present} ligne(s) consignée(s) pour ${expected.length} affiche(s) attendue(s) : des prédictions manquent au journal.`);
  }
  console.log(`✓ journal prospectif : ${present}/${expected.length} affiche(s) consignée(s) dans les ${LOG_WINDOW_DAYS} jours, dont ${written} nouvelle(s)`);
  return { written, expected: expected.length, present };
}

/**
 * Régénère les paramètres du modèle quand de nouveaux résultats de Ligue 1 sont arrivés
 * (match de l'OM compris) ou quand la journée à prédire a changé. Appelé à chaque synchro :
 * le rattrapage quotidien des autres clubs est donc automatique. Renvoie true s'il a écrit.
 *
 * Dans tous les cas, les prédictions des affiches à venir sont consignées dans le journal prospectif ;
 * un journal incomplet lève `PredictionLogError`.
 */
export async function refreshSimulationModel(db: Db | null, token: string, seasonYear: number, force = false): Promise<boolean> {
  const season = await fetchLigue1Season(token, seasonYear);
  const played = season.filter((m) => m.played).length;
  const matchday = nextOmMatchday(season)?.matchday ?? null;

  if (db && !force) {
    // Une table de paramètres illisible ne doit pas empêcher de consigner les prédictions.
    const existing = (await getSimulationParams(db, SIMULATION_PARAMS_KEY).catch((error) => {
      console.warn("⚠ lecture de simulation_params impossible :", (error as Error).message);
      return null;
    })) as ModelParams | null;
    const sameHyper = existing?.hyper?.signature === hyperSignature(seasonHyper(seasonCode(seasonYear)).hyper);
    if (existing && sameHyper && existing.seasonResults >= played && existing.matchday === matchday) {
      console.log(`✓ modèle de simulation : à jour (${played} matchs joués, journée ${matchday ?? "—"})`);
      await logPredictions(db, existing, season, seasonYear);
      return false;
    }
  }

  const params = buildParamsFromSeason(season, seasonYear);
  console.log(
    `✓ modèle de simulation : ${params.matchesUsed} matchs ajustés, données jusqu'au ${params.dataThrough}, ` +
      `journée ${params.matchday ?? "—"} (${params.fixtures.length} affiches à jouer, ${params.playedFixtures?.length ?? 0} déjà jouées)`,
  );
  let stored = false;
  if (db) {
    try {
      await upsertSimulationParams(db, SIMULATION_PARAMS_KEY, params);
      stored = true;
    } catch (error) {
      console.warn("⚠ écriture de simulation_params impossible :", (error as Error).message);
    }
  }
  await logPredictions(db, params, season, seasonYear);
  return stored;
}
