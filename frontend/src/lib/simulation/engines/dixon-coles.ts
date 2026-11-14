/**
 * MOTEUR DE RÉFÉRENCE — Dixon-Coles, conception « score d'abord ».
 *
 * La prédiction (grille de scores) est calculée hors ligne et arrive dans `input.model`.
 * Le moteur ne fait qu'échantillonner, dans cet ordre :
 *   1. temps additionnels ;
 *   2. scénario de cartons rouges (au plus un par équipe), indépendant du score ;
 *   3. score final, tiré dans la grille prédite ;
 *   4. minutes des buts, tirées selon le profil temporel incliné par les cartons rouges ;
 *   5. autres événements (tirs, corners, fautes, cartons…) selon les fréquences mesurées ;
 *   6. joueurs, selon leur poste et leurs statistiques de la saison ;
 *   7. momentum et probabilités en direct, dérivés des événements (aucun n'influence le score).
 *
 * Conséquence voulue : la fréquence des scores simulés converge vers la grille prédite par
 * construction, et les probabilités en direct sont la loi a posteriori exacte du générateur
 * (voir `live.ts`). Sans `input.model`, le moteur retombe sur les forces du classement :
 * la simulation est alors illustrative et l'interface n'affiche aucune probabilité.
 */
import { DEFAULT_EVENT_RATES, scoreGrid, type CountModel, type EventRates } from "@om/match-model";
import { commentary } from "../commentary";
import { intensitySegments, liveOutcome, type LiveContext, type LiveState, type RedScenario } from "../live";
import type { Rng } from "../rng";
import { expectedGoals } from "../strength";
import type {
  EventImportance,
  MatchSimulationInput,
  MinuteFrame,
  SimEvent,
  SimEventType,
  SimPlayer,
  SimulatedMatch,
  SimulationEngine,
  Side,
} from "../types";

export const DIXON_COLES_ENGINE_ID = "dixon-coles";

/**
 * Valeurs par défaut NON mesurées : football-data.co.uk ne fournit ni passes décisives, ni hors-jeu,
 * ni VAR, ni remplacements, ni temps additionnel. Ordres de grandeur usuels, sans effet sur le score.
 */
const ASSIST_RATE = 0.72;
const OFFSIDES_PER_TEAM = 1.9;
const VAR_CONFIRMED_RATE = 0.07;
const DISALLOWED_GOALS_PER_TEAM = 0.045;
const BIG_CHANCE_SHARE = 0.12;
const SUBSTITUTION_MINUTES = [56, 60, 64, 68, 71, 75, 79, 84];

const SCORER_WEIGHT = { GK: 0.01, DEF: 0.7, MID: 2, FWD: 5 } as const;
const ASSIST_WEIGHT = { GK: 0.05, DEF: 1.2, MID: 3, FWD: 2 } as const;
const FOUL_WEIGHT = { GK: 0.05, DEF: 2.2, MID: 2, FWD: 1 } as const;
const SUB_OUT_WEIGHT = { GK: 0, DEF: 0.8, MID: 1.4, FWD: 1.8 } as const;

/** Poids d'un événement dans le momentum (dérivé, purement descriptif). */
const MOMENTUM_WEIGHT: Partial<Record<SimEventType, number>> = { goal: 2.5, big_chance: 1.6, save: 1.4, shot: 1, corner: 0.6 };
const MOMENTUM_MEMORY_MINUTES = 6;

const SIDES = ["home", "away"] as const;
const other = (side: Side): Side => (side === "home" ? "away" : "home");
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// ---------------------------------------------------------------- tirages

function poisson(rng: Rng, mean: number): number {
  if (mean <= 0) return 0;
  if (mean > 40) return Math.max(0, Math.round(mean + Math.sqrt(mean) * rng.normal()));
  const limit = Math.exp(-mean);
  let k = 0;
  let p = rng.next();
  while (p > limit) {
    k++;
    p *= rng.next();
  }
  return k;
}

/** Loi gamma (Marsaglia-Tsang), de moyenne `shape × scale`. */
function gamma(rng: Rng, shape: number, scale: number): number {
  if (shape < 1) return gamma(rng, shape + 1, scale) * rng.next() ** (1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    const x = rng.normal();
    const v = (1 + c * x) ** 3;
    if (v <= 0) continue;
    const u = 1 - rng.next();
    if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v * scale;
  }
}

/** Binomiale négative de moyenne `mean` et de dispersion `k` (variance = mean + mean² / k). */
function negativeBinomial(rng: Rng, mean: number, k: number): number {
  if (k > 500) return poisson(rng, mean);
  return poisson(rng, gamma(rng, k, mean / k));
}

function sampleGrid(rng: Rng, grid: readonly (readonly number[])[]): { home: number; away: number } {
  let roll = rng.next();
  for (let x = 0; x < grid.length; x++) {
    for (let y = 0; y < grid[x].length; y++) {
      roll -= grid[x][y];
      if (roll < 0) return { home: x, away: y };
    }
  }
  return { home: 0, away: 0 };
}

function sampleTime(rng: Rng, segments: readonly { start: number; end: number; mass: number }[]): number {
  const total = segments.reduce((s, seg) => s + seg.mass, 0);
  let roll = rng.next() * total;
  for (const seg of segments) {
    roll -= seg.mass;
    if (roll < 0) return rng.range(seg.start, seg.end);
  }
  const last = segments[segments.length - 1];
  return rng.range(last.start, last.end);
}

function countMean(model: CountModel, side: Side, lambdaOwn: number, lambdaOpponent: number): number {
  const intercept = side === "home" ? model.homeIntercept : model.awayIntercept;
  return Math.exp(intercept + model.ownSlope * Math.log(clamp(lambdaOwn, 0.2, 4)) + model.opponentSlope * Math.log(clamp(lambdaOpponent, 0.2, 4)));
}

// ---------------------------------------------------------------- contexte et relecture

interface Resolved {
  grid: readonly (readonly number[])[];
  lambda: Record<Side, number>;
  rates: EventRates;
}

function resolve(input: MatchSimulationInput): Resolved {
  if (input.model) {
    return { grid: input.model.grid, lambda: { home: input.model.lambdaHome, away: input.model.lambdaAway }, rates: input.model.eventRates };
  }
  // Repli non calibré : forces du classement, double Poisson indépendante.
  const lambda = expectedGoals(input.home.strength, input.away.strength);
  return { grid: scoreGrid(lambda.home, lambda.away), lambda, rates: DEFAULT_EVENT_RATES };
}

/** Contexte des probabilités en direct d'un match simulé par ce moteur. */
export function liveContextOf(match: Pick<SimulatedMatch, "input" | "duration" | "halfTimeAt">): LiveContext {
  const { grid, rates } = resolve(match.input);
  return {
    grid,
    duration: match.duration,
    halfTimeAt: match.halfTimeAt,
    firstHalfShare: rates.firstHalfGoalShare,
    redEffect: rates.redCardEffect,
    redProbability: rates.redProbability,
  };
}

/** Ce que l'on sait à l'instant t, lu dans les seuls événements survenus jusque-là. */
export function liveStateFromEvents(events: readonly SimEvent[], t: number): LiveState {
  const goals = { home: 0, away: 0 };
  const red: RedScenario = { home: null, away: null };
  for (const e of events) {
    if (e.t > t || !e.team) continue;
    if (e.type === "goal") goals[e.team] += 1;
    else if (e.type === "var" && e.varOverturned) goals[e.team] -= 1;
    else if (e.type === "red" && red[e.team] === null) red[e.team] = e.t;
  }
  return { t, goals, red };
}

/** Probabilités 1/N/2 à l'instant t : ne dépend que de l'histoire jusqu'à t (c'est ce que stockent les `frames`). */
export function winProbabilityAt(match: Pick<SimulatedMatch, "input" | "duration" | "halfTimeAt">, events: readonly SimEvent[], t: number) {
  return liveOutcome(liveContextOf(match), liveStateFromEvents(events, t));
}

// ---------------------------------------------------------------- moteur

type SlotKind = "goal" | "disallowed" | "shot" | "corner" | "foul" | "offside" | "red" | "substitution";
interface Slot {
  t: number;
  side: Side;
  kind: SlotKind;
  onTarget?: boolean;
}

export const dixonColesEngine: SimulationEngine = {
  id: DIXON_COLES_ENGINE_ID,
  label: "Dixon-Coles",
  description:
    "Score tiré dans la grille prédite par un modèle Dixon-Coles ajusté hors ligne, puis déroulé minute par minute cohérent avec ce score. Fréquences d'événements mesurées sur l'historique de Ligue 1.",

  simulate(input, rng, seed) {
    const teams = { home: input.home, away: input.away };
    const { grid, lambda, rates } = resolve(input);

    // 1. Temps additionnels (valeurs par défaut, non mesurées).
    const added = { first: rng.int(1, 4), second: rng.int(2, 6) };
    const halfTimeAt = 45 + added.first;
    const duration = halfTimeAt + 45 + added.second;
    const shell = { input, duration, halfTimeAt };
    const context = liveContextOf(shell);

    // 2. Cartons rouges : au plus un par équipe, minute de densité croissante, indépendants du score.
    const red: RedScenario = { home: null, away: null };
    for (const side of SIDES) {
      if (rng.chance(rates.redProbability[side])) red[side] = clamp(duration * Math.sqrt(rng.next()), 1, duration - 1);
    }

    // 3. Score final : tiré dans la grille prédite. Rien ne le modifie ensuite.
    const finalScore = sampleGrid(rng, grid);

    // 4 et 5. Squelette des événements : (instant, équipe, nature).
    const slots: Slot[] = [];
    const anytime = () => rng.range(0.05, duration - 0.05);
    for (const side of SIDES) {
      const opp = other(side);
      const segments = intensitySegments(context, side, red);
      for (let i = 0; i < finalScore[side]; i++) slots.push({ t: clamp(sampleTime(rng, segments), 0.05, duration - 0.05), side, kind: "goal" });

      const shots = negativeBinomial(rng, countMean(rates.nonGoalShots, side, lambda[side], lambda[opp]), rates.nonGoalShots.dispersion);
      for (let i = 0; i < shots; i++) {
        slots.push({ t: clamp(sampleTime(rng, segments), 0.05, duration - 0.05), side, kind: "shot", onTarget: rng.chance(rates.onTargetShare) });
      }
      const corners = poisson(rng, countMean(rates.corners, side, lambda[side], lambda[opp]));
      for (let i = 0; i < corners; i++) slots.push({ t: anytime(), side, kind: "corner" });
      const fouls = poisson(rng, rates.fouls[side]);
      for (let i = 0; i < fouls; i++) slots.push({ t: anytime(), side, kind: "foul" });
      const offsides = poisson(rng, OFFSIDES_PER_TEAM);
      for (let i = 0; i < offsides; i++) slots.push({ t: anytime(), side, kind: "offside" });
      const disallowed = poisson(rng, DISALLOWED_GOALS_PER_TEAM);
      // But refusé : le but et l'annulation tiennent dans la même minute, le score par minute n'en garde pas trace.
      for (let i = 0; i < disallowed; i++) slots.push({ t: rng.int(1, duration - 2) + rng.range(0.05, 0.35), side, kind: "disallowed" });
      if (red[side] !== null) slots.push({ t: red[side]!, side, kind: "red" });

      // Remplacements : 3 à 5 par équipe, groupés sur 2 ou 3 fenêtres en seconde période.
      if (teams[side].bench.length > 0) {
        const windows = rng.shuffle(SUBSTITUTION_MINUTES).slice(0, rng.int(2, 3));
        let remaining = Math.min(rng.int(3, 5), teams[side].bench.length);
        windows.forEach((minute, w) => {
          const n = w === windows.length - 1 ? remaining : Math.min(remaining, rng.int(1, 2));
          remaining -= n;
          for (let i = 0; i < n; i++) slots.push({ t: halfTimeAt + (minute - 45) - 0.5 + i * 0.01, side, kind: "substitution" });
        });
      }
    }
    slots.sort((a, b) => a.t - b.t);

    // 6. Déroulé : on parcourt le squelette dans l'ordre et on attribue les joueurs présents sur le terrain.
    const onPitch: Record<Side, SimPlayer[]> = { home: [...teams.home.starters], away: [...teams.away.starters] };
    const bench: Record<Side, SimPlayer[]> = { home: [...teams.home.bench], away: [...teams.away.bench] };
    const booked = new Set<string>();
    const score = { home: 0, away: 0 };
    let scoreAtHalfTime = { home: 0, away: 0 };
    let halfTimeSeen = false;
    const events: SimEvent[] = [];
    let counter = 0;

    const clock = (t: number) => {
      const k = Math.min(Math.floor(t), duration - 1);
      const period: 1 | 2 = k < halfTimeAt ? 1 : 2;
      const raw = period === 1 ? k + 1 : 45 + (k - halfTimeAt) + 1;
      const cap = period === 1 ? 45 : 90;
      return raw > cap ? { period, minute: cap, addedTime: raw - cap } : { period, minute: raw };
    };
    const push = (t: number, type: SimEventType, team: Side | null, importance: EventImportance, text: string, extra: Partial<SimEvent> = {}): SimEvent => {
      const event: SimEvent = { id: `e${++counter}`, t, ...clock(t), team, type, importance, text, ...extra };
      events.push(event);
      return event;
    };
    const name = (p: SimPlayer | undefined, side: Side) => p?.shortName ?? teams[side].name;
    const outfield = (side: Side) => onPitch[side].filter((p) => p.position !== "GK");
    const keeper = (side: Side) => onPitch[side].find((p) => p.position === "GK");
    const drawShooter = (side: Side) => rng.weighted(onPitch[side], (p) => SCORER_WEIGHT[p.position] * (1 + p.seasonGoals * 0.3));
    const xg = (min: number, max: number) => Math.round(rng.range(min, max) * 100) / 100;

    push(0, "kickoff", "home", 2, commentary(rng, "kickoff", { team: teams.home.name }));

    for (const slot of slots) {
      const { side, t } = slot;
      const opp = other(side);
      if (!halfTimeSeen && t >= halfTimeAt) {
        halfTimeSeen = true;
        scoreAtHalfTime = { ...score };
      }

      switch (slot.kind) {
        case "goal":
        case "disallowed": {
          const scorer = drawShooter(side);
          const assister = rng.chance(ASSIST_RATE)
            ? rng.weighted(onPitch[side].filter((pl) => pl.id !== scorer?.id), (pl) => ASSIST_WEIGHT[pl.position] * (1 + pl.seasonAssists * 0.3))
            : undefined;
          const p = name(scorer, side);
          const text = commentary(rng, "goal", { p }) + (assister ? commentary(rng, "assist", { a: assister.shortName }) : "");
          const goal = push(t, "goal", side, 2, text, { playerId: scorer?.id, secondaryPlayerId: assister?.id, xg: xg(0.12, 0.7) });
          if (slot.kind === "disallowed") {
            push(t + 0.5, "var", side, 2, commentary(rng, "varOverturned", { p }), { varTargetId: goal.id, varOverturned: true, playerId: scorer?.id });
          } else {
            score[side] += 1;
            if (t + 0.6 < duration && rng.chance(VAR_CONFIRMED_RATE)) {
              push(t + 0.5, "var", side, 2, commentary(rng, "varConfirmed", { p }), { varTargetId: goal.id, varOverturned: false, playerId: scorer?.id });
            }
          }
          break;
        }
        case "shot": {
          const shooter = drawShooter(side);
          const p = name(shooter, side);
          if (slot.onTarget) {
            const gk = keeper(opp);
            push(t, "save", side, 1, commentary(rng, "save", { p, gk: name(gk, opp) }), { playerId: shooter?.id, secondaryPlayerId: gk?.id, xg: xg(0.03, 0.3) });
          } else if (rng.chance(BIG_CHANCE_SHARE)) {
            push(t, "big_chance", side, 2, commentary(rng, "bigChance", { p }), { playerId: shooter?.id, xg: xg(0.25, 0.5) });
          } else {
            push(t, "shot", side, 1, commentary(rng, "shot", { p }), { playerId: shooter?.id, xg: xg(0.02, 0.12) });
          }
          break;
        }
        case "corner":
          push(t, "corner", side, 0, commentary(rng, "corner", { team: teams[side].name }));
          break;
        case "offside": {
          const p = rng.weighted(onPitch[side], (pl) => (pl.position === "FWD" ? 4 : pl.position === "MID" ? 1 : 0.1));
          push(t, "offside", side, 0, commentary(rng, "offside", { p: name(p, side) }), { playerId: p?.id });
          break;
        }
        case "foul": {
          const victim = onPitch[opp].length ? rng.pick(onPitch[opp]) : undefined;
          const yellow = rng.chance(rates.yellowPerFoul[side]);
          // Un joueur déjà averti ne reçoit pas de second jaune ici : les expulsions viennent du scénario tiré à l'étape 2.
          const candidates = yellow ? outfield(side).filter((pl) => !booked.has(pl.id)) : outfield(side);
          const fouler = rng.weighted(candidates, (pl) => FOUL_WEIGHT[pl.position]);
          const tokens = { p: name(fouler, side), v: name(victim, opp) };
          const extra = { playerId: fouler?.id, secondaryPlayerId: victim?.id };
          if (yellow && (fouler || onPitch[side].length === 0)) {
            if (fouler) booked.add(fouler.id);
            push(t, "yellow", side, 1, commentary(rng, "yellow", tokens), extra);
          } else {
            push(t, "foul", side, 0, commentary(rng, "foul", tokens), extra);
          }
          break;
        }
        case "red": {
          const victim = onPitch[opp].length ? rng.pick(onPitch[opp]) : undefined;
          const fouler = rng.weighted(outfield(side), (pl) => FOUL_WEIGHT[pl.position] * (booked.has(pl.id) ? 6 : 1));
          const tokens = { p: name(fouler, side), v: name(victim, opp) };
          const second = !!fouler && booked.has(fouler.id);
          push(t, "red", side, 2, commentary(rng, second ? "secondYellow" : "red", tokens), { playerId: fouler?.id, secondaryPlayerId: victim?.id });
          if (fouler) onPitch[side] = onPitch[side].filter((pl) => pl.id !== fouler.id);
          break;
        }
        case "substitution": {
          const out = rng.weighted(outfield(side), (pl) => SUB_OUT_WEIGHT[pl.position]);
          if (!out || bench[side].length === 0) break;
          const samePosition = bench[side].filter((pl) => pl.position === out.position);
          const pool = samePosition.length ? samePosition : bench[side].filter((pl) => pl.position !== "GK");
          // Les remplaçants les plus utilisés cette saison entrent en priorité.
          const incoming = rng.weighted(pool, (pl) => 1 + (pl.seasonAppearances ?? 0));
          if (!incoming) break;
          bench[side] = bench[side].filter((pl) => pl.id !== incoming.id);
          onPitch[side] = onPitch[side].map((pl) => (pl.id === out.id ? incoming : pl));
          push(t, "substitution", side, 1, commentary(rng, "substitution", { team: teams[side].name, in: incoming.shortName, out: out.shortName }), {
            playerId: incoming.id,
            secondaryPlayerId: out.id,
          });
          break;
        }
      }
    }
    if (!halfTimeSeen) scoreAtHalfTime = { ...score };

    const scoreText = (s: { home: number; away: number }) => `${teams.home.name} ${s.home}-${s.away} ${teams.away.name}`;
    push(halfTimeAt, "half_time", null, 2, commentary(rng, "halfTime", { score: scoreText(scoreAtHalfTime) }), { period: 1, minute: 45, addedTime: added.first });
    push(halfTimeAt + 0.02, "kickoff", "away", 2, commentary(rng, "secondHalf", {}));
    push(duration, "full_time", null, 2, commentary(rng, "fullTime", { score: scoreText(score) }));
    events.sort((a, b) => a.t - b.t);

    // 7. Momentum et probabilités en direct : fonctions des seuls événements passés.
    const bias = clamp(((lambda.home - lambda.away) / (lambda.home + lambda.away)) * 0.6, -0.5, 0.5);
    const frames: MinuteFrame[] = [];
    for (let k = 0; k <= duration; k++) {
      let pressure = 0;
      let advantage = 0;
      for (const e of events) {
        if (e.t > k) break;
        if (!e.team) continue;
        const sign = e.team === "home" ? 1 : -1;
        const weight = MOMENTUM_WEIGHT[e.type];
        if (weight) pressure += sign * weight * Math.exp(-(k - e.t) / MOMENTUM_MEMORY_MINUTES);
        if (e.type === "red") advantage -= sign * 0.15;
      }
      const momentum = clamp(0.35 * bias + 0.85 * Math.tanh(pressure / 2.5) + advantage, -1, 1);
      frames.push({
        t: k,
        momentum,
        possessionHome: clamp(50 + 12 * bias + 14 * momentum + (k === 0 ? 0 : 2.5 * rng.normal()), 25, 75),
        winProbability: winProbabilityAt(shell, events, k),
      });
    }

    return { engineId: DIXON_COLES_ENGINE_ID, seed, input, events, addedTime: added, halfTimeAt, duration, frames };
  },
};
