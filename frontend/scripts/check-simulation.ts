/**
 * Contrôles de cohérence du cœur de simulation (pas de framework de test dans le projet).
 * Usage : `bun scripts/check-simulation.ts` depuis `frontend/`.
 */
import { gridMeans, gridOutcome } from "@om/match-model";
import { REFERENCE_PARAMS } from "@om/match-model/reference-params";
import { DEFAULT_ENGINE, ENGINES, runSimulation, buildSimTeam, syncedTime } from "@/src/lib/simulation";
import { liveContextOf, liveStateFromEvents, winProbabilityAt } from "@/src/lib/simulation/engines/dixon-coles";
import { liveOutcome } from "@/src/lib/simulation/live";
import { buildModelInput, buildSimulationModelData } from "@/src/lib/simulation/model-input";
import { applyLiveResults } from "@/src/lib/simulation/standings";
import { buildMultiplexFixtures } from "@/src/lib/simulation/matchday";
import { stateAt } from "@/src/lib/simulation/timeline";
import type { SimPlayer } from "@/src/lib/simulation";
import type { StandingRow } from "@/src/lib/types/standing";

let failures = 0;
function check(label: string, ok: boolean, detail = "") {
  if (!ok) failures += 1;
  console.log(`${ok ? "✓" : "✗"} ${label}${detail ? ` — ${detail}` : ""}`);
}

const squad = (prefix: string): SimPlayer[] =>
  (["GK", "DEF", "DEF", "DEF", "DEF", "MID", "MID", "MID", "FWD", "FWD", "FWD", "DEF", "MID", "MID", "FWD", "FWD"] as const).map(
    (position, i) => ({
      id: `${prefix}${i}`,
      name: `${prefix} Joueur ${i}`,
      shortName: `${prefix}${i}`,
      jersey: i + 1,
      position,
      seasonGoals: position === "FWD" ? 3 : 0,
      seasonAssists: 1,
    }),
  );

const standings: StandingRow[] = Array.from({ length: 18 }, (_, i) => ({
  rank: i + 1,
  clubName: i === 16 ? "Marseille" : `Club ${i + 1}`,
  played: 5,
  won: 2,
  drawn: 1,
  lost: 2,
  goalsFor: 10 - Math.floor(i / 3),
  goalsAgainst: 4 + Math.floor(i / 3),
  points: 30 - i,
  isOm: i === 16,
  zone: i < 2 ? "champions-league" : i >= 15 ? "relegation" : undefined,
}));

const homeTeam = { ...buildSimTeam("Marseille", standings[16]) };
homeTeam.starters = squad("OM").slice(0, 11);
homeTeam.bench = squad("OM").slice(11);
const awayTeam = { ...buildSimTeam("Club 13", standings[12]) };
awayTeam.starters = squad("TFC").slice(0, 11);
awayTeam.bench = squad("TFC").slice(11);
const input = { home: homeTeam, away: awayTeam };

// 1. Déterminisme
const a = runSimulation(input, 123456);
const b = runSimulation(input, 123456);
const c = runSimulation(input, 654321);
check("même graine → mêmes événements", JSON.stringify(a.events) === JSON.stringify(b.events));
check("graine différente → match différent", JSON.stringify(a.events) !== JSON.stringify(c.events));

// 2. Ordres de grandeur sur 2 000 matchs
let goals = 0;
let shots = 0;
let cards = 0;
let subs = 0;
let probErr = 0;
let ratingOut = 0;
let eventsSorted = true;
for (let seed = 1; seed <= 2000; seed++) {
  const m = runSimulation(input, seed);
  const end = stateAt(m, m.duration);
  goals += end.score.home + end.score.away;
  shots += end.stats.home.shots + end.stats.away.shots;
  cards += end.stats.home.yellow + end.stats.away.yellow;
  subs += m.events.filter((e) => e.type === "substitution").length;
  for (const f of m.frames) {
    const sum = f.winProbability.home + f.winProbability.draw + f.winProbability.away;
    probErr = Math.max(probErr, Math.abs(sum - 1));
  }
  ratingOut += end.players.filter((p) => p.rating < 3 || p.rating > 10).length;
  for (let i = 1; i < m.events.length; i++) if (m.events[i].t < m.events[i - 1].t) eventsSorted = false;
  const last = m.frames[m.frames.length - 1].winProbability;
  const outcome = end.score.home > end.score.away ? last.home : end.score.home < end.score.away ? last.away : last.draw;
  if (outcome < 0.999) probErr = Math.max(probErr, 1 - outcome);
}
check("buts / match entre 2 et 3,5", goals / 2000 > 2 && goals / 2000 < 3.5, (goals / 2000).toFixed(2));
check("tirs / match entre 18 et 32", shots / 2000 > 18 && shots / 2000 < 32, (shots / 2000).toFixed(1));
check("jaunes / match entre 2 et 6", cards / 2000 > 2 && cards / 2000 < 6, (cards / 2000).toFixed(1));
check("remplacements / match entre 6 et 10", subs / 2000 >= 6 && subs / 2000 <= 10, (subs / 2000).toFixed(1));
check("probas 1/N/2 = 100 % et certitude au coup de sifflet final", probErr < 1e-6, probErr.toExponential(2));
check("notes bornées entre 3 et 10", ratingOut === 0);
check("événements triés dans le temps", eventsSorted);

// 3. Classement en direct
const fixtures = buildMultiplexFixtures(standings, ["Marseille", "Club 13"], 42);
check("8 autres affiches, chaque club une fois", fixtures.length === 8 && new Set(fixtures.flatMap((f) => [f.input.home.name, f.input.away.name])).size === 16);
const results = [
  { home: "Marseille", away: "Club 13", homeGoals: 2, awayGoals: 1 },
  ...fixtures.map((f, i) => ({ home: f.input.home.name, away: f.input.away.name, homeGoals: i % 3, awayGoals: 1 })),
];
const live = applyLiveResults(standings, results);
const basePoints = standings.reduce((s, r) => s + r.points, 0);
const livePoints = live.reduce((s, r) => s + r.points, 0);
const expected = results.reduce((s, r) => s + (r.homeGoals === r.awayGoals ? 2 : 3), 0);
check("points distribués cohérents", livePoints - basePoints === expected, `${livePoints - basePoints} vs ${expected}`);
check("rangs uniques 1..18", live.map((r) => r.rank).join() === Array.from({ length: 18 }, (_, i) => i + 1).join());
check("zones attachées aux places", live[0].zone === "champions-league" && live[17].zone === "relegation");

// 4. Synchronisation du multiplex
const other = runSimulation(fixtures[0].input, 7);
check("multiplex à la pause quand le match principal y est", syncedTime(a, other, a.halfTimeAt) === Math.min(a.halfTimeAt, other.halfTimeAt));
check("multiplex terminé au coup de sifflet final", syncedTime(a, other, a.duration) === other.duration);

// ====================================================================================
// Contrôles du moteur de référence (Dixon-Coles, « score d'abord »)
// ====================================================================================
console.log("\n— Moteur de référence —");
check("le moteur par défaut est Dixon-Coles, le générateur de démonstration reste disponible", DEFAULT_ENGINE.id === "dixon-coles" && ENGINES.some((e) => e.id === "placeholder"));

// Affiche réelle de la copie de référence des paramètres (match de l'OM de la journée prédite).
const params = REFERENCE_PARAMS;
const omFixture = params.fixtures.find((f) => f.home === "Marseille" || f.away === "Marseille") ?? params.fixtures[0];
const model = buildModelInput(params, omFixture.home, omFixture.away)!;
const calibratedInput = { home: { ...homeTeam, name: omFixture.home }, away: { ...awayTeam, name: omFixture.away }, model };
const predicted = gridOutcome(model.grid);
console.log(
  `  Affiche testée : ${omFixture.home} – ${omFixture.away}, prédiction ${(100 * predicted.home).toFixed(1)} / ${(100 * predicted.draw).toFixed(1)} / ${(100 * predicted.away).toFixed(1)} %, ` +
    `buts attendus ${model.lambdaHome.toFixed(2)} – ${model.lambdaAway.toFixed(2)}`,
);

// 5. Convergence : fréquence des scores simulés → grille prédite.
const RUNS = 6000;
function convergence(label: string, simInput: typeof calibratedInput | typeof input, grid: readonly (readonly number[])[]) {
  const counts = grid.map((row) => row.map(() => 0));
  const outcomes = { home: 0, draw: 0, away: 0 };
  const startedAt = performance.now();
  for (let seed = 1; seed <= RUNS; seed++) {
    const m = runSimulation(simInput, seed);
    const s = stateAt(m, m.duration).score;
    counts[Math.min(s.home, grid.length - 1)][Math.min(s.away, grid.length - 1)] += 1;
    outcomes[s.home > s.away ? "home" : s.home < s.away ? "away" : "draw"] += 1;
  }
  const ms = (performance.now() - startedAt) / RUNS;
  let totalVariation = 0;
  let worst = 0;
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      const p = grid[x][y];
      const f = counts[x][y] / RUNS;
      totalVariation += Math.abs(f - p) / 2;
      // Écart rapporté à l'écart-type d'échantillonnage, pour les cases suffisamment fréquentes.
      if (p * RUNS >= 5) worst = Math.max(worst, Math.abs(f - p) / Math.sqrt((p * (1 - p)) / RUNS));
    }
  }
  const p = gridOutcome(grid);
  const sd = (q: number) => Math.sqrt((q * (1 - q)) / RUNS);
  const z = Math.max(Math.abs(outcomes.home / RUNS - p.home) / sd(p.home), Math.abs(outcomes.draw / RUNS - p.draw) / sd(p.draw), Math.abs(outcomes.away / RUNS - p.away) / sd(p.away));
  check(
    `${label} : 1/N/2 simulé ≈ prédit (${RUNS} graines, écart < 3,5 σ)`,
    z < 3.5,
    `simulé ${(100 * outcomes.home / RUNS).toFixed(1)} / ${(100 * outcomes.draw / RUNS).toFixed(1)} / ${(100 * outcomes.away / RUNS).toFixed(1)} % ; prédit ${(100 * p.home).toFixed(1)} / ${(100 * p.draw).toFixed(1)} / ${(100 * p.away).toFixed(1)} % ; écart max ${z.toFixed(2)} σ`,
  );
  check(`${label} : chaque score exact ≈ grille (écart < 4 σ par case)`, worst < 4, `pire case ${worst.toFixed(2)} σ ; distance en variation totale ${totalVariation.toFixed(4)}`);
  return ms;
}
const msPerMatch = convergence("convergence (modèle calibré)", calibratedInput, model.grid);
convergence("convergence (repli sans modèle)", input, liveContextOf(runSimulation(input, 1)).grid);
check("un match simulé en moins de 20 ms (navigateur : 1 + 8 matchs)", msPerMatch < 20, `${msPerMatch.toFixed(2)} ms par match`);

// 6. Cohérence des probabilités en direct.
{
  const m = runSimulation(calibratedInput, 2024);
  const p0 = m.frames[0].winProbability;
  const err = Math.max(Math.abs(p0.home - predicted.home), Math.abs(p0.draw - predicted.draw), Math.abs(p0.away - predicted.away));
  check("probabilités à t = 0 identiques à la prédiction d'avant-match", err < 1e-9, err.toExponential(2));
  const means = gridMeans(model.grid);
  check("buts attendus transmis = moyennes de la grille", Math.abs(means.home - model.lambdaHome) < 5e-3 && Math.abs(means.away - model.lambdaAway) < 5e-3);

  let framesFromHistory = true;
  for (let k = 0; k <= m.duration; k++) {
    const p = winProbabilityAt(m, m.events, k);
    const f = m.frames[k].winProbability;
    if (Math.abs(p.home - f.home) + Math.abs(p.draw - f.draw) + Math.abs(p.away - f.away) > 1e-12) framesFromHistory = false;
  }
  check("chaque frame se recalcule depuis les seuls événements passés", framesFromHistory);
}

// 7. Invariance : même histoire jusqu'à t, carton rouge futur différent → même probabilité.
{
  let redMatch = runSimulation(calibratedInput, 1);
  for (let seed = 1; seed < 500; seed++) {
    const m = runSimulation(calibratedInput, seed);
    const red = m.events.find((e) => e.type === "red");
    if (red && red.t > 30 && red.t < m.duration - 15) {
      redMatch = m;
      break;
    }
  }
  const red = redMatch.events.find((e) => e.type === "red")!;
  // Trois futurs alternatifs : sans rouge, rouge plus tard, rouge pour l'autre équipe.
  const withoutRed = redMatch.events.filter((e) => e.type !== "red");
  const later = redMatch.events.map((e) => (e.type === "red" ? { ...e, t: Math.min(redMatch.duration - 1, e.t + 10) } : e)).sort((a, b) => a.t - b.t);
  const swapped = redMatch.events.map((e) => (e.type === "red" ? { ...e, team: e.team === "home" ? ("away" as const) : ("home" as const) } : e));
  let maxBefore = 0;
  let maxAfter = 0;
  for (let k = 0; k <= redMatch.duration; k++) {
    const base = winProbabilityAt(redMatch, redMatch.events, k);
    for (const alt of [withoutRed, later, swapped]) {
      const p = winProbabilityAt(redMatch, alt, k);
      const d = Math.abs(p.home - base.home) + Math.abs(p.draw - base.draw) + Math.abs(p.away - base.away);
      if (k < red.t) maxBefore = Math.max(maxBefore, d);
      else if (k < redMatch.duration) maxAfter = Math.max(maxAfter, d);
    }
  }
  check(`invariance : avant le rouge (${red.minute}'), la probabilité ne dépend pas du rouge à venir`, maxBefore < 1e-12, `écart max ${maxBefore.toExponential(2)}`);
  check("le rouge, une fois sorti, déplace bien la probabilité", maxAfter > 1e-3, `écart max ${maxAfter.toFixed(4)}`);

  // Même test directement sur la forme close : l'état à t ne contient aucune information future.
  const ctx = liveContextOf(redMatch);
  const state = liveStateFromEvents(redMatch.events, Math.floor(red.t) - 1);
  const a = liveOutcome(ctx, state);
  const b = liveOutcome(ctx, liveStateFromEvents(withoutRed, Math.floor(red.t) - 1));
  check("forme close : états identiques → probabilités identiques", a.home === b.home && a.draw === b.draw && a.away === b.away && state.red.home === null && state.red.away === null);
}

// 8. Calibration des probabilités en direct contre le générateur lui-même (à la 30e et à la 70e minute).
{
  for (const minute of [30, 70]) {
    const bins = Array.from({ length: 10 }, () => ({ n: 0, p: 0, o: 0 }));
    for (let seed = 1; seed <= RUNS; seed++) {
      const m = runSimulation(calibratedInput, seed);
      const t = minute <= 45 ? minute : m.halfTimeAt + (minute - 45);
      const final = stateAt(m, m.duration).score;
      const p = m.frames[t].winProbability;
      for (const [prob, won] of [[p.home, final.home > final.away], [p.draw, final.home === final.away], [p.away, final.home < final.away]] as const) {
        const bin = bins[Math.min(9, Math.floor(prob * 10))];
        bin.n += 1;
        bin.p += prob;
        bin.o += won ? 1 : 0;
      }
    }
    // Écart moyen pondéré entre probabilité annoncée et fréquence réalisée.
    const total = bins.reduce((s, b) => s + b.n, 0);
    const gap = bins.reduce((s, b) => s + (b.n ? Math.abs(b.p - b.o) : 0), 0) / total;
    check(`probabilités en direct calibrées à la ${minute}e minute`, gap < 0.012, `écart moyen ${(100 * gap).toFixed(2)} point(s) sur ${RUNS} matchs`);
  }
}

// 9. Fréquences d'événements : simulé contre mesuré sur l'historique.
{
  const rates = model.eventRates;
  const sum = { goals1: 0, goals: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellow: 0, red: 0 };
  let expectedShots = 0;
  let expectedCorners = 0;
  const lh = Math.log(model.lambdaHome);
  const la = Math.log(model.lambdaAway);
  expectedShots =
    Math.exp(rates.nonGoalShots.homeIntercept + rates.nonGoalShots.ownSlope * lh + rates.nonGoalShots.opponentSlope * la) +
    Math.exp(rates.nonGoalShots.awayIntercept + rates.nonGoalShots.ownSlope * la + rates.nonGoalShots.opponentSlope * lh) +
    model.lambdaHome + model.lambdaAway;
  expectedCorners =
    Math.exp(rates.corners.homeIntercept + rates.corners.ownSlope * lh + rates.corners.opponentSlope * la) +
    Math.exp(rates.corners.awayIntercept + rates.corners.ownSlope * la + rates.corners.opponentSlope * lh);
  const n = 3000;
  for (let seed = 1; seed <= n; seed++) {
    const m = runSimulation(calibratedInput, seed);
    const end = stateAt(m, m.duration);
    const half = stateAt(m, m.halfTimeAt);
    sum.goals += end.score.home + end.score.away;
    sum.goals1 += half.score.home + half.score.away;
    for (const side of ["home", "away"] as const) {
      sum.shots += end.stats[side].shots;
      sum.onTarget += end.stats[side].shotsOnTarget;
      sum.corners += end.stats[side].corners;
      sum.fouls += end.stats[side].fouls;
      sum.yellow += end.stats[side].yellow;
      sum.red += end.stats[side].red;
    }
  }
  const near = (value: number, target: number, tolerance: number) => Math.abs(value - target) <= tolerance * target;
  const report = (value: number, target: number) => `simulé ${value.toFixed(2)}, cible ${target.toFixed(2)}`;
  const fouls = rates.fouls.home + rates.fouls.away;
  const yellows = rates.fouls.home * rates.yellowPerFoul.home + rates.fouls.away * rates.yellowPerFoul.away;
  const reds = rates.redProbability.home + rates.redProbability.away;
  check("tirs par match conformes au modèle de comptage mesuré (± 5 %)", near(sum.shots / n, expectedShots, 0.05), report(sum.shots / n, expectedShots));
  check("corners par match conformes (± 5 %)", near(sum.corners / n, expectedCorners, 0.05), report(sum.corners / n, expectedCorners));
  check("fautes par match conformes à la mesure (± 5 %)", near(sum.fouls / n, fouls + reds, 0.05), report(sum.fouls / n, fouls + reds));
  check("jaunes par match conformes à la mesure (± 8 %)", near(sum.yellow / n, yellows, 0.08), report(sum.yellow / n, yellows));
  check("rouges par match conformes à la mesure (± 15 %)", near(sum.red / n, reds, 0.15), report(sum.red / n, reds));
  // Le partage par période est décalé par les rares cartons rouges et le but refusé : tolérance large.
  check("part des buts en première période conforme à la mesure (± 2 points)", Math.abs(sum.goals1 / sum.goals - rates.firstHalfGoalShare) < 0.02, `simulé ${(100 * sum.goals1 / sum.goals).toFixed(1)} %, mesuré ${(100 * rates.firstHalfGoalShare).toFixed(1)} %`);
}

// 10. Multiplex réel, repli illustratif et matchs hors Ligue 1.
{
  const data = buildSimulationModelData(params, omFixture.home, omFixture.away);
  const names = Object.keys(params.teams);
  const table: StandingRow[] = names.map((clubName, i) => ({ ...standings[i], clubName, isOm: clubName === "Marseille" }));
  const real = buildMultiplexFixtures(table, [omFixture.home, omFixture.away], 42, data.multiplex);
  check(
    "multiplex : affiches du calendrier réel, toutes prédites par le modèle",
    real.length === params.fixtures.length - 1 && real.every((f) => f.source === "calendrier" && !!f.input.model),
    `${real.length} affiches`,
  );
  const fallback = buildMultiplexFixtures(table, [omFixture.home, omFixture.away], 42, null);
  check("multiplex de repli étiqueté illustratif, sans modèle", fallback.length === 8 && fallback.every((f) => f.source === "illustratif" && !f.input.model));
  check("match hors Ligue 1 : aucune prédiction transmise", buildModelInput(params, "Marseille", "Olympiacos") === undefined && buildSimulationModelData(params, "Marseille", "Olympiacos").main === undefined);
  const direct = buildModelInput(params, omFixture.away, omFixture.home);
  check("affiche de Ligue 1 hors journée : prédiction en forme close depuis les forces", direct?.provenance.source === "forces");
}

// 11. Calibration sur les résultats connus : garde-fous lus dans le dernier backtest.
{
  const bt = params.backtest;
  const find = (prefix: string) => Object.entries(bt?.rps ?? {}).find(([k]) => k.startsWith(prefix))?.[1] ?? NaN;
  const model = find("E.");
  check(
    "backtest : le modèle fait mieux que les fréquences de base et que l'ancien modèle",
    !!bt && model < find("(1)") && model < find("(3)"),
    bt ? `RPS modèle ${model}, fréquences de base ${find("(1)")}, ancien modèle ${find("(3)")}, cotes ${find("(4)")} (${bt.matches} matchs)` : "backtest absent des paramètres",
  );
}

console.log(failures === 0 ? "\nTous les contrôles passent." : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
