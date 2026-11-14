/**
 * Contrôles du journal prospectif (pas de framework de test dans le projet).
 * Usage : `bun run model:check-log`.
 *
 * La migration SQL réelle est exécutée dans un Postgres embarqué (PGlite, en mémoire) : ce sont
 * les vrais déclencheurs qui sont testés, pas une imitation. Aucune base réelle n'est touchée.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { appendPredictionLog, getPredictionLog, type PredictionLogEntry } from "@om/db";
import { createTestDb } from "@om/db/testing";
import type { ModelParams } from "@om/match-model";
import { FROZEN_HYPER, SELECTED_HYPER, evaluateProspective, hyperSignature, seasonHyper, selectFinalPredictions, type ProspectiveRow } from "@om/match-model/fit";
import { loadHistory } from "@om/match-model/history";
import { REFERENCE_PARAMS } from "@om/match-model/reference-params";
import type { Ligue1SeasonMatch } from "../src/football-data";
import { LOG_WINDOW_DAYS, PredictionLogError, buildLogEntries, currentCodeCommit, fixturesToLog, logPredictions, paramsHash } from "../src/simulation-model";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}
/** Vrai si la promesse échoue ; renvoie aussi le message d'erreur de la base. */
async function rejects(run: () => Promise<unknown>): Promise<{ rejected: boolean; message: string }> {
  try {
    await run();
    return { rejected: false, message: "accepté" };
  } catch (error) {
    const e = error as { message?: string; cause?: { message?: string } };
    return { rejected: true, message: e.cause?.message ?? e.message ?? String(error) };
  }
}

// ------------------------------------------------------------------ base embarquée + migration réelle
const MIGRATION = readFileSync(join(import.meta.dir, "..", "..", "..", "supabase", "migrations", "20261114130000_prediction_log.sql"), "utf8");
const pg = await createTestDb([MIGRATION]);
const db = pg.db;
const count = async () => Number((await pg.query<{ n: number }>("SELECT count(*)::int AS n FROM prediction_log"))[0].n);

const HOUR = 3_600_000;
const now = Date.now();
const grid = REFERENCE_PARAMS.fixtures[0].grid;
const entry = (over: Partial<PredictionLogEntry>): PredictionLogEntry => ({
  matchId: "1001",
  season: "2627",
  matchday: 11,
  homeTeam: "Marseille",
  awayTeam: "Le Mans",
  kickoff: new Date(now + 48 * HOUR),
  paramsHash: "hash-a",
  hyperHash: "hyper-a",
  codeCommit: "0123456789abcdef0123456789abcdef01234567",
  dataThrough: "2026-11-08",
  grid,
  pHome: 0.7,
  pDraw: 0.18,
  pAway: 0.12,
  probabilityInterval: { home: [0.6, 0.8], draw: [0.1, 0.25], away: [0.05, 0.2] },
  lambdaHome: 2.5,
  lambdaAway: 0.9,
  ...over,
});

console.log("— Écriture seule —");
{
  const first = await appendPredictionLog(db, [entry({})]);
  check("une prédiction d'avant-match est écrite", first.written === 1 && (await count()) === 1);

  const again = await appendPredictionLog(db, [entry({})]);
  check("la même prédiction n'est pas réécrite (ni doublon, ni écrasement)", again.written === 0 && (await count()) === 1);

  const updated = await appendPredictionLog(db, [entry({ paramsHash: "hash-b", pHome: 0.66, pDraw: 0.2, pAway: 0.14 })]);
  const rows = await getPredictionLog(db, "2627");
  check(
    "de nouveaux paramètres ajoutent une ligne, l'ancienne reste intacte",
    updated.written === 1 && rows.length === 2 && rows[0].paramsHash === "hash-a" && rows[0].pHome === 0.7 && rows[1].pHome === 0.66,
  );
  check("la grille complète, l'intervalle et les λ sont relus tels qu'écrits", JSON.stringify(rows[0].grid) === JSON.stringify(grid) && rows[0].probabilityInterval.home[1] === 0.8 && rows[0].lambdaHome === 2.5);

  const update = await rejects(() => pg.exec("UPDATE prediction_log SET p_home = 0.99, p_draw = 0.005, p_away = 0.005"));
  check("UPDATE refusé par la base", update.rejected && (await getPredictionLog(db, "2627"))[0].pHome === 0.7, update.message);
  const del = await rejects(() => pg.exec("DELETE FROM prediction_log"));
  check("DELETE refusé par la base", del.rejected && (await count()) === 2, del.message);
  const truncate = await rejects(() => pg.exec("TRUNCATE prediction_log"));
  check("TRUNCATE refusé par la base", truncate.rejected && (await count()) === 2, truncate.message);
  const upsert = await rejects(() =>
    pg.exec(
      "INSERT INTO prediction_log (match_id, season, matchday, home_team, away_team, kickoff, params_hash, hyper_hash, code_commit, grid, p_home, p_draw, p_away, probability_interval, lambda_home, lambda_away) " +
        "SELECT match_id, season, matchday, home_team, away_team, kickoff, params_hash, hyper_hash, code_commit, grid, 0.9, 0.05, 0.05, probability_interval, lambda_home, lambda_away FROM prediction_log WHERE params_hash = 'hash-a' " +
        "ON CONFLICT (match_id, params_hash, kickoff) DO UPDATE SET p_home = EXCLUDED.p_home",
    ),
  );
  check("écrasement par ON CONFLICT DO UPDATE refusé par la base", upsert.rejected && (await getPredictionLog(db, "2627"))[0].pHome === 0.7, upsert.message);
}

console.log("\n— Refus après le coup d'envoi —");
{
  const before = await count();
  const started = entry({ matchId: "1002", homeTeam: "Lille", awayTeam: "Lyon", kickoff: new Date(now - HOUR) });
  const viaApp = await appendPredictionLog(db, [started, entry({ matchId: "1003", homeTeam: "Nice", awayTeam: "Paris-SG" })]);
  check("côté application : le match commencé est écarté, les autres sont écrits", viaApp.written === 1 && viaApp.refused.length === 1 && viaApp.refused[0].matchId === "1002" && (await count()) === before + 1);

  // On contourne volontairement le filtre applicatif (horloge truquée) : la base doit refuser seule.
  const forced = await rejects(() => appendPredictionLog(db, [started], new Date(now - 2 * HOUR)));
  check("côté base : écriture refusée même si l'application la laisse passer", forced.rejected && (await count()) === before + 1, forced.message);

  const direct = await rejects(() =>
    pg.exec(
      "INSERT INTO prediction_log (match_id, season, matchday, home_team, away_team, kickoff, written_at, params_hash, hyper_hash, code_commit, grid, p_home, p_draw, p_away, probability_interval, lambda_home, lambda_away) " +
        "VALUES ('1004', '2627', 11, 'Lens', 'Toulouse', now() - interval '1 minute', now() - interval '1 day', 'h', 'h', 'c', '[[1]]', 0.5, 0.3, 0.2, '{}', 1, 1)",
    ),
  );
  check("antidater l'horodatage ne permet pas d'écrire après le coup d'envoi", direct.rejected, direct.message);

  await pg.exec(
    "INSERT INTO prediction_log (match_id, season, matchday, home_team, away_team, kickoff, written_at, params_hash, hyper_hash, code_commit, grid, p_home, p_draw, p_away, probability_interval, lambda_home, lambda_away) " +
      "VALUES ('1005', '2627', 11, 'Lens', 'Toulouse', now() + interval '1 day', '2020-01-01', 'h', 'h', 'c', '[[1]]', 0.5, 0.3, 0.2, '{}', 1, 1)",
  );
  const stamped = (await getPredictionLog(db, "2627")).find((r) => r.matchId === "1005")!;
  check("l'horodatage d'écriture est imposé par la base", Math.abs(new Date(stamped.writtenAt).getTime() - Date.now()) < 60_000, new Date(stamped.writtenAt).toISOString());

  const invalid = await rejects(() => appendPredictionLog(db, [entry({ matchId: "1006", pHome: 0.9 })]));
  check("probabilités qui ne somment pas à 1 : refusées", invalid.rejected);
}

console.log("\n— Contenu du journal : toute affiche à " + LOG_WINDOW_DAYS + " jours, empreinte stable —");
const params = { ...REFERENCE_PARAMS } as ModelParams;
const DAY = 24 * HOUR;
const at = (days: number) => new Date(now + days * DAY).toISOString();
// Calendrier fictif : la journée en cours (J11) dans 1 à 3 jours, la J12 (affiches retour) dans 8 jours,
// la J13 dans 16 jours (hors fenêtre), un match en retard de la J9 dans 5 jours, un match déjà joué,
// et un match non joué dont la date est passée.
const j11: Ligue1SeasonMatch[] = params.fixtures.map((f, i) => ({ id: 5000 + i, matchday: 11, date: at(1 + (i % 3)), home: f.home, away: f.away, played: false }));
const j12: Ligue1SeasonMatch[] = params.fixtures.map((f, i) => ({ id: 6000 + i, matchday: 12, date: at(8), home: f.away, away: f.home, played: false }));
const j13: Ligue1SeasonMatch[] = params.fixtures.map((f, i) => ({ id: 7000 + i, matchday: 13, date: at(16), home: f.home, away: f.away, played: false }));
const lateMatch: Ligue1SeasonMatch = { id: 8000, matchday: 9, date: at(5), home: j11[0].home, away: j11[1].home, played: false };
const playedMatch: Ligue1SeasonMatch = { id: 8001, matchday: 10, date: at(-6), home: j11[2].home, away: j11[3].home, played: true, homeScore: 1, awayScore: 0 };
const overdue: Ligue1SeasonMatch = { id: 8002, matchday: 10, date: at(-1), home: j11[4].home, away: j11[5].home, played: false };
const calendar = [...j11, ...j12, ...j13, lateMatch, playedMatch, overdue];
const clock = new Date(now);
{
  const expected = fixturesToLog(calendar, clock);
  const entries = buildLogEntries(params, calendar, 2026, clock, "abc123");
  const ids = new Set(entries.map((e) => e.matchId));
  check(
    "toute affiche non jouée à 14 jours est consignée, quelle que soit sa journée",
    entries.length === 19 && expected.length === 19 && j11.every((m) => ids.has(String(m.id))) && j12.every((m) => ids.has(String(m.id))) && ids.has("8000"),
    `${entries.length} lignes : 9 de la J11, 9 de la J12, 1 match en retard de la J9`,
  );
  check("hors fenêtre, déjà joué ou date dépassée : non consigné", !j13.some((m) => ids.has(String(m.id))) && !ids.has("8001") && !ids.has("8002"));
  check("la limite est bien de 14 jours", fixturesToLog([{ ...j13[0], date: new Date(now + 14 * DAY - 60_000).toISOString() }], clock).length === 1 && fixturesToLog([{ ...j13[0], date: new Date(now + 14 * DAY + 60_000).toISOString() }], clock).length === 0);
  check("pas seulement l'OM : une seule des 9 affiches de la journée le concerne", entries.filter((e) => e.matchday === 11 && (e.homeTeam === "Marseille" || e.awayTeam === "Marseille")).length === 1);

  const complete = (e: (typeof entries)[number]) =>
    e.grid.length === 11 && Math.abs(e.pHome + e.pDraw + e.pAway - 1) < 1e-3 && e.probabilityInterval.home[0] < e.pHome && e.pHome < e.probabilityInterval.home[1] && e.lambdaHome > 0 && e.lambdaAway > 0 && e.kickoff instanceof Date && e.paramsHash.length === 64 && e.hyperHash.length === 64 && e.codeCommit === "abc123";
  check("chaque ligne porte grille, 1/N/2, intervalle, λ, coup d'envoi, empreintes et commit du code", entries.every(complete));
  const onSite = entries.find((e) => e.matchId === "5000")!;
  check("affiche de la journée : prédiction identique à celle affichée sur le site", JSON.stringify(onSite.grid) === JSON.stringify(params.fixtures[0].grid) && onSite.pHome === params.fixtures[0].probabilities.home);
  // L'affiche retour est calculée depuis les forces : l'avantage du domicile doit avoir changé de camp.
  const back = entries.find((e) => e.matchId === "6000")!;
  check("affiche hors journée : calculée depuis les mêmes forces (avantage du domicile inversé)", Math.abs(back.lambdaHome - onSite.lambdaAway) > 0.05 && back.lambdaHome > onSite.lambdaAway && back.homeTeam === onSite.awayTeam);

  check("commit du code : GITHUB_SHA dans le workflow, sinon le commit Git local", /^[0-9a-f]{40}$/.test(currentCodeCommit()), currentCodeCommit().slice(0, 8));
  const saved = process.env.GITHUB_SHA;
  process.env.GITHUB_SHA = "f".repeat(40);
  const fromCi = currentCodeCommit();
  if (saved === undefined) delete process.env.GITHUB_SHA;
  else process.env.GITHUB_SHA = saved;
  check("GITHUB_SHA prime quand il est défini", fromCi === "f".repeat(40));

  // Un jsonb relu depuis Postgres ne garde pas l'ordre des clés : l'empreinte ne doit pas en dépendre.
  const shuffled = JSON.parse(JSON.stringify(params)) as ModelParams;
  shuffled.league = Object.fromEntries(Object.entries(shuffled.league).reverse()) as ModelParams["league"];
  shuffled.teams = Object.fromEntries(Object.entries(shuffled.teams).reverse());
  check("empreinte des paramètres insensible à l'ordre des clés", paramsHash(shuffled) === paramsHash(params));
  const moved = JSON.parse(JSON.stringify(params)) as ModelParams;
  moved.teams.Marseille.att += 0.001;
  check("empreinte sensible au moindre changement de force", paramsHash(moved) !== paramsHash(params));
}

console.log("\n— Complétude : la synchro échoue si des lignes manquent —");
{
  const fresh = await createTestDb([MIGRATION]);
  const first = await logPredictions(fresh.db, params, calendar, 2026, clock);
  check("première synchro : autant de lignes écrites que d'affiches attendues", first.written === 19 && first.expected === 19 && first.present === 19, `${first.written} écrites / ${first.expected} attendues`);
  const second = await logPredictions(fresh.db, params, calendar, 2026, clock);
  check("synchro suivante, mêmes paramètres : rien de réécrit, journal toujours complet", second.written === 0 && second.present === 19 && second.expected === 19);

  // Base où une ligne est avalée en silence (déclencheur parasite) : l'insertion « réussit » mais il manque une affiche.
  const lossy = await createTestDb([MIGRATION]);
  await lossy.exec(
    "CREATE FUNCTION swallow_one() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.match_id = '6003' THEN RETURN NULL; END IF; RETURN NEW; END; $$; " +
      "CREATE TRIGGER a_swallow BEFORE INSERT ON prediction_log FOR EACH ROW EXECUTE FUNCTION swallow_one();",
  );
  const short = await rejects(() => logPredictions(lossy.db, params, calendar, 2026, clock));
  const kept = Number((await lossy.query<{ n: number }>("SELECT count(*)::int AS n FROM prediction_log"))[0].n);
  check("18 lignes écrites pour 19 attendues : erreur levée", short.rejected && short.message.includes("18 ligne(s) consignée(s) pour 19 affiche(s) attendue(s)") && kept === 18, short.message);

  // Table absente (migration non appliquée) : plus d'échec silencieux.
  const noTable = await createTestDb([]);
  let typed = false;
  try {
    await logPredictions(noTable.db, params, calendar, 2026, clock);
  } catch (error) {
    typed = error instanceof PredictionLogError;
  }
  check("table absente : erreur de journal levée (la synchro sort en code 1)", typed);

  // Sans base (dry run) : rien n'est écrit, rien n'échoue.
  const dry = await logPredictions(null, params, calendar, 2026, clock);
  check("dry run : aucune écriture, aucune erreur", dry.written === 0 && dry.expected === 19);

  const index = readFileSync(join(import.meta.dir, "..", "src", "index.ts"), "utf8");
  check("la synchro compte une erreur de journal comme un échec (code de sortie 1)", /error instanceof PredictionLogError\) \{\s*failures\+\+/.test(index) && index.includes("process.exit(failures > 0 ? 1 : 0)"));
}

console.log("\n— Gel des hyperparamètres —");
{
  const frozen = seasonHyper("2627");
  check("la saison 2026-27 a des hyperparamètres gelés", !!FROZEN_HYPER["2627"] && frozen.frozenAt === "2026-11-14", hyperSignature(frozen.hyper));
  check("la copie de référence des paramètres a été produite avec ces hyperparamètres", REFERENCE_PARAMS.hyper?.signature === hyperSignature(frozen.hyper) && REFERENCE_PARAMS.hyper?.season === "2627");
  check("une saison sans gel est refusée (pas de repli silencieux)", (await rejects(async () => seasonHyper("2728"))).rejected);
  console.log(`  Pour information, dernier backtest : ${hyperSignature(SELECTED_HYPER)}${hyperSignature(SELECTED_HYPER) === hyperSignature(frozen.hyper) ? " (identique au gel)" : " (DIFFÉRENT du gel : le gel prime)"}`);
}

console.log("\n— Évaluation prospective —");
{
  const history = loadHistory();
  const sample = history.filter((m) => m.season === "2526" && m.odds);
  const kickoff = (m: (typeof sample)[number]) => new Date(`${m.date}T19:00:00Z`);
  const row = (m: (typeof sample)[number], i: number, hoursBefore: number, p: [number, number, number]): ProspectiveRow => ({
    matchId: `m${i}`, season: "2526", matchday: 1 + Math.floor(i / 9), home: m.home, away: m.away, kickoff: kickoff(m),
    writtenAt: new Date(kickoff(m).getTime() - hoursBefore * HOUR), paramsHash: `p${hoursBefore}`, hyperHash: "h", codeCommit: "c1", grid, probabilities: p,
  });
  const implied = (m: (typeof sample)[number]): [number, number, number] => {
    const inv = [1 / m.odds!.h, 1 / m.odds!.d, 1 / m.odds!.a];
    const s = inv[0] + inv[1] + inv[2];
    return [inv[0] / s, inv[1] / s, inv[2] / s];
  };
  // Trois lignes par match : une vieille prédiction quelconque, la dernière d'avant-match (= cotes), une écrite trop tard.
  const rows = sample.flatMap((m, i) => [row(m, i, 72, [0.34, 0.33, 0.33]), row(m, i, 2, implied(m)), row(m, i, -1, [0.98, 0.01, 0.01])]);
  const selection = selectFinalPredictions(rows);
  check(
    "on garde la dernière prédiction écrite avant le coup d'envoi",
    selection.kept.length === sample.length && selection.kept.every((r) => r.paramsHash === "p2") && selection.superseded === sample.length && selection.late === sample.length,
    `${selection.kept.length} gardées, ${selection.superseded} remplacées, ${selection.late} écartées car tardives`,
  );
  const report = evaluateProspective(rows, history, "2526");
  const d = report.summary.deltaRpsVsOdds;
  check(
    "jointure résultats + cotes : une prédiction égale aux cotes donne un écart nul",
    report.summary.evaluated === sample.length && report.summary.withOdds === sample.length && !!d && Math.abs(d.mean) < 1e-12 && Math.abs(report.summary.rps! - report.summary.oddsRps!) < 1e-12,
    `${report.summary.evaluated} matchs, RPS ${report.summary.rps!.toFixed(4)}`,
  );
  check("le rapport contient RPS, log-loss, calibration et intervalles", ["RPS [IC 95 %]", "Log-loss [IC 95 %]", "## Calibration", "bootstrap par blocs"].every((s) => report.markdown.includes(s)));
  const empty = evaluateProspective([], history, "2627");
  check("journal vide : rapport sans erreur", empty.summary.evaluated === 0 && empty.markdown.includes("Aucun match évaluable"));
  const mixed = evaluateProspective(rows.map((r, i) => (i % 2 ? { ...r, hyperHash: "autre" } : r)), history, "2526");
  check("un changement d'hyperparamètres en cours de saison est signalé", mixed.summary.hyperHashes === 2 && mixed.markdown.includes("ATTENTION"));
  const recoded = evaluateProspective(rows.map((r, i) => (i % 6 === 1 ? { ...r, codeCommit: "c2" } : r)), history, "2526");
  check("un changement de code en cours de saison est signalé", recoded.summary.codeCommits === 2 && recoded.markdown.includes("le code du modèle a changé") && report.summary.codeCommits === 1);
}

console.log(failures === 0 ? "\nTous les contrôles passent." : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
