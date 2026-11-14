/**
 * Backtest de référence du modèle de prédiction (phase 3).
 *
 * Fenêtre glissante sans fuite : pour chaque jour de match, tout est ajusté sur les matchs
 * strictement antérieurs. Hyperparamètres choisis sur les saisons de validation, figés pour le test.
 *
 * Usage : `bun run model:backtest`
 * Écrit `docs/simulation-backtest-resultats.md` et `packages/match-model/data/backtest-summary.json`.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import historyFile from "../data/ligue1-history.json";
import type { EloRun } from "../src/elo";
import { fitDixonColes, matchLogRates, type FitConfig, type FitResult } from "../src/fit";
import { gridOutcome, predictiveGrid, scoreGrid, type ScoreGrid } from "../src/grid";
import { decodeHistory, oddsPower, oddsProportional, seasonLabel, seasonTeams, type HistoryFile } from "../src/history";
import { asTriple, brier, logLoss, outcomeOf, rps, scoreLogLoss } from "../src/metrics";
import { ELO_BASE, eloPrior, fitEloGoalModel, runElo, toModelMatches, type EloGoalModel } from "../src/model";

const history = decodeHistory(historyFile as unknown as HistoryFile);
const matches = toModelMatches(history);
const teamsBySeason = seasonTeams(history);
const seasons = Object.keys(teamsBySeason).sort();
const BURN_IN = seasons[0];
const CURRENT = seasons[seasons.length - 1];
const VALIDATION = ["1819", "1920", "2021", "2122", "2223"];
const TEST = ["2324", "2425", "2526"];
const WINDOW_DAYS = 1500;
const BOOTSTRAP = 2000;

// ------------------------------------------------------------------ contexte par match
const N = matches.length;
const outcome = matches.map((m) => outcomeOf(m.hg, m.ag));
const playedBefore = new Array<number>(N);
const withPromoted = new Array<boolean>(N);
const block = new Array<number>(N);
{
  const count = new Map<string, number>();
  let season = "";
  let lastDay = -99;
  let blockId = -1;
  matches.forEach((m, i) => {
    if (m.season !== season) {
      season = m.season;
      count.clear();
      lastDay = -99;
    }
    const h = count.get(m.home) ?? 0;
    const a = count.get(m.away) ?? 0;
    playedBefore[i] = Math.min(h, a);
    count.set(m.home, h + 1);
    count.set(m.away, a + 1);
    const previous = seasons[seasons.indexOf(season) - 1];
    withPromoted[i] = !!previous && (!teamsBySeason[previous].includes(m.home) || !teamsBySeason[previous].includes(m.away));
    // Une « journée » = matchs séparés de moins de deux jours du précédent.
    if (m.day - lastDay >= 2) blockId++;
    lastDay = m.day;
    block[i] = blockId;
  });
}
const firstDay = Object.fromEntries(seasons.map((s) => [s, matches.find((m) => m.season === s)!.day]));

/**
 * Garde-fou contre la fuite du test vers le réglage. Pendant le choix des hyperparamètres, tout ce qui
 * ajuste ou prédit ne voit que `visible` : les matchs joués jusqu'au dernier jour de la validation.
 * Les saisons de test n'existent pas pour le code de réglage, et toute tentative d'y accéder lève une erreur.
 */
const lastValidationDay = Math.max(...matches.filter((m) => VALIDATION.includes(m.season)).map((m) => m.day));
const firstTestDay = Math.min(...matches.filter((m) => TEST.includes(m.season)).map((m) => m.day));
if (lastValidationDay >= firstTestDay) throw new Error("Les saisons de validation doivent précéder entièrement les saisons de test.");
const tuningMatches = matches.filter((m) => m.day <= lastValidationDay);
const tuningTeams = Object.fromEntries(Object.entries(teamsBySeason).filter(([s]) => firstDay[s] <= lastValidationDay));
let visible: typeof matches = tuningMatches;
let visibleTeams: typeof teamsBySeason = tuningTeams;
let testOpened = false;
const guard = (i: number) => {
  if (i >= visible.length) throw new Error(`Fuite : accès au match ${i} (${matches[i].season}) pendant le réglage.`);
};
const indicesOf = (list: readonly string[]) => matches.map((m, i) => (list.includes(m.season) ? i : -1)).filter((i) => i >= 0);

// ------------------------------------------------------------------ prédictions
interface Pred {
  p: [number, number, number];
  grid?: ScoreGrid;
}
type Preds = (Pred | undefined)[];

interface EloContext {
  k: number;
  promoted: number;
  run: EloRun;
  goals: Record<string, EloGoalModel>;
}

function makeElo(k: number, promoted: number): EloContext {
  const run = runElo(visible, visibleTeams, { ...ELO_BASE, k, promotedRating: promoted });
  const known = Object.keys(visibleTeams).sort();
  const goals = Object.fromEntries(known.slice(1).map((s) => [s, fitEloGoalModel(visible, run, firstDay[s], BURN_IN)]));
  return { k, promoted, run, goals };
}

function predictElo(ctx: EloContext, idx: readonly number[]): Preds {
  const out: Preds = new Array(N);
  for (const i of idx) {
    guard(i);
    const g = ctx.goals[matches[i].season];
    const x = (ctx.run.pre[i].home - ctx.run.pre[i].away) / 400;
    const grid = scoreGrid(Math.exp(g.home + g.beta * x), Math.exp(g.away - g.beta * x));
    out[i] = { p: asTriple(gridOutcome(grid)), grid };
  }
  return out;
}

interface DcOptions extends Partial<FitConfig> {
  halfLifeDays: number;
  sigma: number;
  eloPrior: boolean;
}

function predictDixonColes(ctx: EloContext, idx: readonly number[], opts: DcOptions): { plugin: Preds; predictive: Preds; last?: FitResult } {
  const plugin: Preds = new Array(N);
  const predictive: Preds = new Array(N);
  const { eloPrior: useElo, ...overrides } = opts;
  const cfg: FitConfig = { windowDays: WINDOW_DAYS, rho: true, covidGamma: true, ...overrides };
  let fit: FitResult | undefined;
  let day = -1;
  let season = "";
  for (const i of idx) {
    guard(i);
    const m = matches[i];
    if (m.season !== season) {
      season = m.season;
      fit = undefined;
    }
    if (m.day !== day) {
      day = m.day;
      const prior = useElo
        ? eloPrior(ctx.run.snapshots.get(day)!, teamsBySeason[season], ctx.goals[season].beta, ELO_BASE.initialRating)
        : { att: {}, def: {} };
      fit = fitDixonColes(visible, day, cfg, prior, teamsBySeason[season], fit);
    }
    const r = matchLogRates(fit!, m.home, m.away, { covid: cfg.covidGamma && m.covid });
    const rest = fit!.rest;
    const logHome = r.logHome + (cfg.restEffect && m.shortRestHome ? rest : 0);
    const logAway = r.logAway + (cfg.restEffect && m.shortRestAway ? rest : 0);
    const g1 = scoreGrid(Math.exp(logHome), Math.exp(logAway), fit!.rho);
    const g2 = predictiveGrid(logHome, r.sdHome, logAway, r.sdAway, fit!.rho);
    plugin[i] = { p: asTriple(gridOutcome(g1)), grid: g1 };
    predictive[i] = { p: asTriple(gridOutcome(g2)), grid: g2 };
  }
  return { plugin, predictive, last: fit };
}

function predictBaseRates(idx: readonly number[]): Preds {
  const out: Preds = new Array(N);
  for (const i of idx) {
    const c = [0, 0, 0];
    let n = 0;
    for (let j = 0; j < N && matches[j].day < matches[i].day; j++) {
      if (matches[j].day < matches[i].day - WINDOW_DAYS) continue;
      c[outcome[j]]++;
      n++;
    }
    out[i] = { p: [c[0] / n, c[1] / n, c[2] / n] };
  }
  return out;
}

/** Ancien modèle : `strengthFromStanding` (4 matchs fictifs à 1,4) + constantes 1,12 / 0,90 + double Poisson. */
function predictLegacy(idx: readonly number[]): Preds {
  const out: Preds = new Array(N);
  for (const i of idx) {
    const m = matches[i];
    const strength = (team: string) => {
      let gf = 0, ga = 0, n = 0;
      for (let j = 0; j < i; j++) {
        const x = matches[j];
        if (x.season !== m.season || x.day >= m.day) continue;
        if (x.home === team) { gf += x.hg; ga += x.ag; n++; } else if (x.away === team) { gf += x.ag; ga += x.hg; n++; }
      }
      return { attack: (gf + 5.6) / (n + 4), defense: (ga + 5.6) / (n + 4) };
    };
    const h = strength(m.home);
    const a = strength(m.away);
    const grid = scoreGrid(((h.attack * a.defense) / 1.4) * 1.12, ((a.attack * h.defense) / 1.4) * 0.9);
    out[i] = { p: asTriple(gridOutcome(grid)), grid };
  }
  return out;
}

function predictOdds(idx: readonly number[], method: "proportional" | "power"): Preds {
  const out: Preds = new Array(N);
  for (const i of idx) {
    const o = history[i].odds;
    if (o) out[i] = { p: method === "power" ? oddsPower(o) : oddsProportional(o) };
  }
  return out;
}

function recalibrate(preds: Preds, k: number): Preds {
  return preds.map((pr) => {
    if (!pr) return pr;
    const q = pr.p.map((x) => x ** k);
    const s = q[0] + q[1] + q[2];
    return { p: [q[0] / s, q[1] / s, q[2] / s] as [number, number, number] };
  });
}

// ------------------------------------------------------------------ mesures
type Metric = "rps" | "logloss" | "brier" | "score";
function loss(pr: Pred, i: number, metric: Metric): number {
  guard(i);
  if (metric === "rps") return rps(pr.p, outcome[i]);
  if (metric === "logloss") return logLoss(pr.p, outcome[i]);
  if (metric === "brier") return brier(pr.p, outcome[i]);
  return pr.grid ? scoreLogLoss(pr.grid, matches[i].hg, matches[i].ag) : NaN;
}
function mean(preds: Preds, idx: readonly number[], metric: Metric): number {
  let s = 0;
  for (const i of idx) s += loss(preds[i]!, i, metric);
  return s / idx.length;
}

function mulberry(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Différence moyenne de perte (a − b) et intervalle à 95 % par bootstrap apparié par blocs de journées. */
function difference(a: Preds, b: Preds, idx: readonly number[], metric: Metric) {
  const sums = new Map<number, [number, number]>();
  for (const i of idx) {
    const d = loss(a[i]!, i, metric) - loss(b[i]!, i, metric);
    const cell = sums.get(block[i]) ?? [0, 0];
    cell[0] += d;
    cell[1] += 1;
    sums.set(block[i], cell);
  }
  const blocks = [...sums.values()];
  const total = blocks.reduce((s, c) => s + c[0], 0);
  const count = blocks.reduce((s, c) => s + c[1], 0);
  const random = mulberry(20261114);
  const draws: number[] = [];
  for (let b = 0; b < BOOTSTRAP; b++) {
    let s = 0;
    let n = 0;
    for (let k = 0; k < blocks.length; k++) {
      const cell = blocks[Math.floor(random() * blocks.length)];
      s += cell[0];
      n += cell[1];
    }
    draws.push(s / n);
  }
  draws.sort((x, y) => x - y);
  return { mean: total / count, lo: draws[Math.floor(0.025 * BOOTSTRAP)], hi: draws[Math.floor(0.975 * BOOTSTRAP)], blocks: blocks.length };
}

const f4 = (x: number) => (Number.isNaN(x) ? "—" : x.toFixed(4).replace(".", ","));
const signed = (x: number) => `${x >= 0 ? "+" : "−"}${Math.abs(x).toFixed(4).replace(".", ",")}`;
const ci = (d: { mean: number; lo: number; hi: number }) => `${signed(d.mean)} [${signed(d.lo)} ; ${signed(d.hi)}]`;
const pct = (x: number) => (100 * x).toFixed(1).replace(".", ",");

const out: string[] = [];
const say = (line = "") => {
  out.push(line);
  console.log(line);
};
function table(header: string[], rows: string[][]) {
  say(`| ${header.join(" | ")} |`);
  say(`|${header.map(() => "---").join("|")}|`);
  for (const row of rows) say(`| ${row.join(" | ")} |`);
  say();
}

// ------------------------------------------------------------------ 1. réglages sur la validation
const started = Date.now();
const validationIdx = indicesOf(VALIDATION);
const testIdx = indicesOf(TEST);
const currentIdx = indicesOf([CURRENT]);

say("# Backtest de référence — résultats bruts");
say();
say(`Fichier généré par \`bun run model:backtest\` le ${new Date().toISOString().slice(0, 10)}. Ne pas modifier à la main.`);
say();
say(`- Historique : ${N} matchs de Ligue 1, ${seasonLabel(seasons[0])} à ${seasonLabel(CURRENT)} (football-data.co.uk).`);
say(`- Validation (choix des hyperparamètres) : ${VALIDATION.map(seasonLabel).join(", ")} — ${validationIdx.length} matchs.`);
say(`- Test (hyperparamètres figés) : ${TEST.map(seasonLabel).join(", ")} — ${testIdx.length} matchs. Saison en cours ${seasonLabel(CURRENT)} : ${currentIdx.length} matchs, rapportée à part.`);
say(`- Fenêtre d'ajustement : ${WINDOW_DAYS} jours. Intervalles à 95 % : bootstrap apparié par blocs de journées, ${BOOTSTRAP} rééchantillonnages.`);
say();

say("## 1. Réglage de l'Elo interne (validation)");
say();
let elo = makeElo(20, 1450);
{
  let best = Infinity;
  const rows: string[][] = [];
  for (const k of [10, 15, 20, 30]) {
    const row = [`K = ${k}`];
    for (const promoted of [1350, 1400, 1450, 1500]) {
      const ctx = makeElo(k, promoted);
      const v = mean(predictElo(ctx, validationIdx), validationIdx, "rps");
      row.push(f4(v));
      if (v < best) {
        best = v;
        elo = ctx;
      }
    }
    rows.push(row);
  }
  table(["RPS validation", "promu 1350", "promu 1400", "promu 1450", "promu 1500"], rows);
  say(`Retenu : K = ${elo.k}, note d'entrée d'un promu = ${elo.promoted}.`);
  say();
}

say("## 2. Réglage de Dixon-Coles (validation, moyenne prédictive)");
say();
const HALF_LIVES = [365, 730, Infinity];
const hlLabel = (h: number) => (h === Infinity ? "aucune" : `${h} j`);
function tune(useElo: boolean, sigmas: number[]) {
  let best = { halfLifeDays: 730, sigma: sigmas[0], rps: Infinity };
  const rows: string[][] = [];
  for (const halfLifeDays of HALF_LIVES) {
    const row = [hlLabel(halfLifeDays)];
    for (const sigma of sigmas) {
      const pr = predictDixonColes(elo, validationIdx, { halfLifeDays, sigma, eloPrior: useElo }).predictive;
      const v = mean(pr, validationIdx, "rps");
      row.push(`${f4(v)} / ${f4(mean(pr, validationIdx, "logloss"))} / ${f4(mean(pr, validationIdx, "score"))}`);
      if (v < best.rps) best = { halfLifeDays, sigma, rps: v };
    }
    rows.push(row);
  }
  table(["Demi-vie", ...sigmas.map((s) => `σ = ${String(s).replace(".", ",")}`)], rows);
  return best;
}
say("A priori Elo — RPS / log-loss / log-perte du score exact :");
say();
const chosen = tune(true, [0.06, 0.1, 0.15, 0.25, 0.4]);
say("A priori à moyenne unique (sans Elo) :");
say();
const chosenFlat = tune(false, [0.25, 0.4, 1.5]);
say(`Retenu avec a priori Elo : demi-vie ${hlLabel(chosen.halfLifeDays)}, σ = ${chosen.sigma}. Sans Elo : demi-vie ${hlLabel(chosenFlat.halfLifeDays)}, σ = ${chosenFlat.sigma}.`);
say(`Critère de choix : RPS de validation le plus bas (déclaré avant le test).`);
say();

const reference: DcOptions = { halfLifeDays: chosen.halfLifeDays, sigma: chosen.sigma, eloPrior: true };

// Recalibrage par puissance, appris sur la validation.
const validationRef = predictDixonColes(elo, validationIdx, reference).predictive;
let power = 1;
{
  let best = Infinity;
  for (let k = 0.5; k <= 1.5001; k += 0.01) {
    const v = mean(recalibrate(validationRef, k), validationIdx, "logloss");
    if (v < best) {
      best = v;
      power = Math.round(k * 100) / 100;
    }
  }
}

// ------------------------------------------------------------------ gel des réglages, ouverture du test
const frozen = { ...reference, eloK: elo.k, promoted: elo.promoted, flat: { ...chosenFlat }, power };
say("## 2 bis. Étanchéité entre réglage et test");
say();
say(`- Dernier match visible pendant le réglage : ${history[tuningMatches.length - 1].date} (${tuningMatches.length} matchs). Premier match du test : ${history[tuningMatches.length].date}.`);
say("- Pendant le réglage, l'Elo, la pente Elo → buts, les ajustements et le recalibrage ne reçoivent que ces matchs : les saisons de test ne sont pas chargées dans le jeu de données visible, et le script s'arrête sur toute tentative d'accès.");
say(`- Réglages gelés avant l'ouverture du test : K = ${frozen.eloK}, promu = ${frozen.promoted}, demi-vie = ${hlLabel(frozen.halfLifeDays)}, σ = ${frozen.sigma}, puissance de recalibrage = ${frozen.power}.`);
say("- Les grilles de valeurs candidates et les constantes non réglées (fenêtre de 1 500 jours, avantage du domicile de l'Elo à 60 points, a priori à huis clos) sont fixées dans le code, pas choisies sur le test.");
say();
if (testOpened) throw new Error("Le test ne doit être ouvert qu'une fois.");
testOpened = true;
visible = matches;
visibleTeams = teamsBySeason;
// L'Elo est recalculé sur l'historique complet avec les réglages gelés (il reste séquentiel : une note d'avant-match ne voit que le passé).
elo = makeElo(frozen.eloK, frozen.promoted);

// ------------------------------------------------------------------ 2. évaluation
interface Evaluation {
  E: Preds;
  plugin: Preds;
  B: Preds;
  last?: FitResult;
  summary: Record<string, unknown>;
}

function evaluate(title: string, idx: readonly number[], full: boolean): Evaluation {
  say(`## ${title}`);
  say();
  const ref = predictDixonColes(elo, idx, reference);
  const E = ref.predictive;
  const B = predictElo(elo, idx);
  const models: [string, Preds][] = [
    ["(1) Fréquences de base", predictBaseRates(idx)],
    ["(3) Ancien modèle (classement + double Poisson)", predictLegacy(idx)],
    ["(2) B. Elo → λ", B],
    ["**E. Dixon-Coles + a priori Elo (moyenne prédictive)**", E],
    ["(4) Cotes de clôture, normalisation proportionnelle", predictOdds(idx, "proportional")],
    ["(4 bis) Cotes de clôture, méthode de la puissance", predictOdds(idx, "power")],
  ];
  table(
    ["Modèle", "RPS", "Log-loss", "Brier", "Log-perte score exact", "ΔRPS contre E [IC 95 %]", "Δlog-loss contre E [IC 95 %]"],
    models.map(([name, pr]) => [
      name,
      f4(mean(pr, idx, "rps")),
      f4(mean(pr, idx, "logloss")),
      f4(mean(pr, idx, "brier")),
      f4(mean(pr, idx, "score")),
      pr === E ? "référence" : ci(difference(pr, E, idx, "rps")),
      pr === E ? "référence" : ci(difference(pr, E, idx, "logloss")),
    ]),
  );
  const summary: Record<string, unknown> = {
    matches: idx.length,
    rps: Object.fromEntries(models.map(([name, pr]) => [name.replace(/\*/g, ""), Number(mean(pr, idx, "rps").toFixed(4))])),
    logloss: Object.fromEntries(models.map(([name, pr]) => [name.replace(/\*/g, ""), Number(mean(pr, idx, "logloss").toFixed(4))])),
  };
  if (!full) return { E, plugin: ref.plugin, B, last: ref.last, summary };

  // --- E contre B, saison par saison
  say("### E contre B, saison par saison");
  say();
  table(
    ["Saison", "n", "RPS E", "RPS B", "ΔRPS (E − B) [IC 95 %]", "Log-loss E", "Log-loss B", "Score exact E", "Score exact B", "Δscore exact (E − B) [IC 95 %]"],
    [...new Set(idx.map((i) => matches[i].season))].map((s) => {
      const sub = idx.filter((i) => matches[i].season === s);
      return [
        seasonLabel(s), String(sub.length), f4(mean(E, sub, "rps")), f4(mean(B, sub, "rps")), ci(difference(E, B, sub, "rps")),
        f4(mean(E, sub, "logloss")), f4(mean(B, sub, "logloss")), f4(mean(E, sub, "score")), f4(mean(B, sub, "score")), ci(difference(E, B, sub, "score")),
      ];
    }),
  );
  say(`Ensemble : Δscore exact (E − B) = ${ci(difference(E, B, idx, "score"))}.`);
  say();

  // --- petit échantillon, promus
  say("### Erreur selon l'avancement de la saison et selon la présence d'un promu (RPS)");
  say();
  const legacy = models[1][1];
  const odds = models[4][1];
  const flat = predictDixonColes(elo, idx, { halfLifeDays: chosenFlat.halfLifeDays, sigma: chosenFlat.sigma, eloPrior: false }).predictive;
  const slices: [string, (i: number) => boolean][] = [
    ["J1 à J5", (i) => playedBefore[i] < 5],
    ["J6 à J11", (i) => playedBefore[i] >= 5 && playedBefore[i] < 11],
    ["J12 et après", (i) => playedBefore[i] >= 11],
    ["Avec un promu", (i) => withPromoted[i]],
    ["Sans promu", (i) => !withPromoted[i]],
  ];
  table(
    ["Tranche", "n", "Ancien modèle", "B. Elo", "E", "E sans a priori Elo", "Cotes", "E − cotes [IC 95 %]"],
    slices.map(([name, keep]) => {
      const sub = idx.filter(keep);
      return [name, String(sub.length), f4(mean(legacy, sub, "rps")), f4(mean(B, sub, "rps")), f4(mean(E, sub, "rps")), f4(mean(flat, sub, "rps")), f4(mean(odds, sub, "rps")), ci(difference(E, odds, sub, "rps"))];
    }),
  );

  // --- calibration
  say("### Calibration (trois issues empilées) : prédit → observé, en %");
  say();
  const recal = recalibrate(E, power);
  const bins = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 1.0001];
  const calibration = (pr: Preds, lo: number, hi: number) => {
    let n = 0, p = 0, o = 0;
    for (const i of idx) {
      pr[i]!.p.forEach((x, k) => {
        if (x >= lo && x < hi) { n++; p += x; o += k === outcome[i] ? 1 : 0; }
      });
    }
    return n ? `${pct(p / n)} → ${pct(o / n)} (n = ${n})` : "—";
  };
  table(
    ["Tranche prédite", "E ponctuel (sans incertitude)", "E moyenne prédictive", `E recalibré (puissance ${power})`, "Cotes (proportionnelle)", "Cotes (puissance)"],
    bins.slice(0, -1).map((lo, b) => [
      `${Math.round(lo * 100)}-${b === bins.length - 2 ? 100 : Math.round(bins[b + 1] * 100)} %`,
      calibration(ref.plugin, lo, bins[b + 1]), calibration(E, lo, bins[b + 1]), calibration(recal, lo, bins[b + 1]),
      calibration(odds, lo, bins[b + 1]), calibration(models[5][1], lo, bins[b + 1]),
    ]),
  );
  say(`Moyenne prédictive contre estimation ponctuelle : Δlog-loss = ${ci(difference(E, ref.plugin, idx, "logloss"))}, ΔRPS = ${ci(difference(E, ref.plugin, idx, "rps"))}.`);
  say();
  const recalLl = difference(recal, E, idx, "logloss");
  say(`Recalibrage par puissance (k = ${power}, appris sur la validation) contre E : Δlog-loss = ${ci(recalLl)}, ΔRPS = ${ci(difference(recal, E, idx, "rps"))}.`);
  say(recalLl.hi < 0 ? "→ Le recalibrage améliore le log-loss hors échantillon : **admis**." : "→ Le recalibrage n'améliore pas le log-loss hors échantillon de façon démontrée : **non retenu**.");
  say();

  // --- ablations
  say("### Ablations et entrées candidates");
  say();
  say("Δ = perte de la variante − perte de E. Positif : le composant de E est utile. « Démontré » : l'intervalle à 95 % du ΔRPS exclut zéro.");
  say();
  const run = (o: Partial<DcOptions>) => predictDixonColes(elo, idx, { ...reference, ...o });
  const variants: [string, string, Preds][] = [
    ["Historique multi-saisons", "ancien modèle, saison en cours seule", legacy],
    ["Avantage du domicile", "mis à zéro", run({ fixedHomeLog: 0 }).predictive],
    ["Avantage du domicile estimé", "fixé à 1,12 / 0,90", run({ fixedHomeLog: Math.log(1.12 / 0.9) }).predictive],
    ["A priori Elo", "moyenne unique, σ et demi-vie réglés à part", flat],
    ["Pondération temporelle", "aucune", run({ halfLifeDays: Infinity }).predictive],
    ["Correction ρ", "ρ = 0", run({ rho: false }).predictive],
    ["γ séparé pour 2020-21", "γ unique", run({ covidGamma: false }).predictive],
    ["Moyenne prédictive", "estimation ponctuelle", ref.plugin],
    ["Sans le repos court (candidat)", "avec effet du repos ≤ 4 j", run({ restEffect: true }).predictive],
  ];
  const components: { component: string; status: string; deltaRps: number; lo: number; hi: number }[] = [];
  table(
    ["Composant de E", "Variante comparée", "RPS variante", "ΔRPS [IC 95 %]", "Δlog-loss [IC 95 %]", "Δscore exact [IC 95 %]", "Verdict"],
    variants.map(([component, variant, pr]) => {
      const d = difference(pr, E, idx, "rps");
      const status = d.lo > 0 ? "démontré" : d.hi < 0 ? "défavorable" : "non démontré";
      components.push({ component, status, deltaRps: Number(d.mean.toFixed(4)), lo: Number(d.lo.toFixed(4)), hi: Number(d.hi.toFixed(4)) });
      return [component, variant, f4(mean(pr, idx, "rps")), ci(d), ci(difference(pr, E, idx, "logloss")), ci(difference(pr, E, idx, "score")), `**${status}**`];
    }),
  );
  const last = ref.last!;
  say(`Dernier ajustement de la période : μ = ${last.mu.toFixed(3)}, γ = ${last.gamma.toFixed(3)} (× ${Math.exp(last.gamma).toFixed(3)}), ρ = ${last.rho.toFixed(3)}, itérations = ${last.iterations}.`);
  say();
  {
    const THRESHOLD = 0.7;
    let cases = 0, p = 0, o = 0;
    for (const i of idx) {
      E[i]!.p.forEach((x, k) => {
        if (x >= THRESHOLD) { cases++; p += x; o += k === outcome[i] ? 1 : 0; }
      });
    }
    summary.highConfidence = { threshold: THRESHOLD, predicted: Number((p / cases).toFixed(3)), observed: Number((o / cases).toFixed(3)), cases };
  }
  summary.components = components;
  summary.recalibration = { power, deltaLogLoss: Number(recalLl.mean.toFixed(4)), admitted: recalLl.hi < 0 };
  return { E, plugin: ref.plugin, B, last: ref.last, summary };
}

const test = evaluate(`3. Test : ${TEST.map(seasonLabel).join(", ")}`, testIdx, true);
const current = evaluate(`4. Saison en cours ${seasonLabel(CURRENT)} (partielle, à titre indicatif)`, currentIdx, false);

// Effet Covid sur la saison 2020-21 elle-même (validation).
say("## 5. Avantage du domicile et huis clos (validation)");
say();
{
  const covidIdx = indicesOf(["2021"]);
  const after = indicesOf(["2122", "2223"]);
  const separate = predictDixonColes(elo, [...covidIdx, ...after], reference).predictive;
  const single = predictDixonColes(elo, [...covidIdx, ...after], { ...reference, covidGamma: false }).predictive;
  table(
    ["Saisons", "RPS γ séparé", "RPS γ unique", "Δ (unique − séparé) [IC 95 %]"],
    [["2020-21", covidIdx], ["2021-22 et 2022-23", after]].map(([name, idx]) => [
      name as string, f4(mean(separate, idx as number[], "rps")), f4(mean(single, idx as number[], "rps")), ci(difference(single, separate, idx as number[], "rps")),
    ]),
  );
}

say("## 6. Cotes : colonnes utilisées");
say();
{
  const columns = new Map<string, number>();
  for (const i of [...testIdx, ...currentIdx]) columns.set(history[i].odds?.column ?? "absente", (columns.get(history[i].odds?.column ?? "absente") ?? 0) + 1);
  say(`Test et saison en cours : ${[...columns].map(([c, n]) => `${c}H / ${c}D / ${c}A (${n} matchs)`).join(", ")}.`);
  const all = new Map<string, number>();
  for (const m of history) all.set(m.odds?.column ?? "absente", (all.get(m.odds?.column ?? "absente") ?? 0) + 1);
  say(`Historique complet : ${[...all].map(([c, n]) => `${c} (${n})`).join(", ")}.`);
  say();
}
say(`Durée du backtest : ${((Date.now() - started) / 1000).toFixed(0)} s.`);

const root = join(import.meta.dir, "..", "..", "..");
writeFileSync(join(root, "docs", "simulation-backtest-resultats.md"), `${out.join("\n")}\n`);
writeFileSync(
  join(import.meta.dir, "..", "data", "backtest-summary.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      validationSeasons: VALIDATION,
      testSeasons: TEST,
      selected: {
        halfLifeDays: chosen.halfLifeDays === Infinity ? null : chosen.halfLifeDays,
        sigma: chosen.sigma,
        windowDays: WINDOW_DAYS,
        eloK: elo.k,
        promotedRating: elo.promoted,
        recalibrationPower: (test.summary.recalibration as { admitted: boolean }).admitted ? power : null,
      },
      test: test.summary,
      current: current.summary,
    },
    null,
    2,
  )}\n`,
);
