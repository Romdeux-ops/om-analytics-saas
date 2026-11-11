/**
 * Contrôles de cohérence du cœur de simulation (pas de framework de test dans le projet).
 * Usage : `bun scripts/check-simulation.ts` depuis `frontend/`.
 */
import { runSimulation, buildSimTeam, syncedTime } from "@/src/lib/simulation";
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

console.log(failures === 0 ? "\nTous les contrôles passent." : `\n${failures} contrôle(s) en échec.`);
process.exit(failures === 0 ? 0 : 1);
