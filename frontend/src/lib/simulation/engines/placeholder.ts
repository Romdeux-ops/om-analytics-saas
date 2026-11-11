/**
 * MOTEUR PROVISOIRE — sert uniquement à alimenter l'interface.
 *
 * Il produit un match crédible (tirs avec xG, buts, cartons, corners,
 * remplacements, VAR, momentum) à partir de la force des deux équipes.
 * Il ne prétend à aucune validité statistique : les moteurs étudiés dans le
 * mémoire (Poisson, Markov, ML) le remplaceront en implémentant `SimulationEngine`.
 */
import { commentary } from "../commentary";
import { outcomeProbabilities } from "../probability";
import type { Rng } from "../rng";
import { expectedGoals } from "../strength";
import type {
  EventImportance,
  MinuteFrame,
  SimEvent,
  SimEventType,
  SimPlayer,
  SimulationEngine,
  Side,
} from "../types";

/** xG moyen d'un tir généré (voir `drawXg`) : sert à caler le nombre de tirs. */
const MEAN_SHOT_XG = 0.135;
const BIG_CHANCE_RATE = 0.13;
const ON_TARGET_RATE = 0.38;
const ASSIST_RATE = 0.72;
const VAR_CHECK_RATE = 0.1;
const VAR_OVERTURN_RATE = 0.3;
const YELLOW_PER_FOUL = 0.14;
const STRAIGHT_RED_PER_FOUL = 0.004;
const RED_CARD_ATTACK_FACTOR = 0.72;

const SCORER_WEIGHT = { GK: 0.01, DEF: 0.7, MID: 2, FWD: 5 } as const;
const ASSIST_WEIGHT = { GK: 0.05, DEF: 1.2, MID: 3, FWD: 2 } as const;
const FOUL_WEIGHT = { GK: 0.05, DEF: 2.2, MID: 2, FWD: 1 } as const;
const SUB_OUT_WEIGHT = { GK: 0, DEF: 0.8, MID: 1.4, FWD: 1.8 } as const;

const other = (side: Side): Side => (side === "home" ? "away" : "home");
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function drawXg(rng: Rng, big: boolean): number {
  if (big) return rng.range(0.3, 0.65);
  return 0.02 + rng.next() ** 2 * 0.2;
}

export const placeholderEngine: SimulationEngine = {
  id: "placeholder",
  label: "Moteur de démonstration",
  description:
    "Générateur provisoire (tirs × xG, momentum aléatoire lissé) destiné à faire vivre l'interface en attendant les moteurs du mémoire.",

  simulate(input, rng, seed) {
    const teams = { home: input.home, away: input.away };
    const lambda = expectedGoals(input.home.strength, input.away.strength);

    const added = { first: rng.int(1, 4), second: rng.int(2, 6) };
    const halfTimeAt = 45 + added.first;
    const duration = halfTimeAt + 45 + added.second;

    const onPitch: Record<Side, SimPlayer[]> = { home: [...teams.home.starters], away: [...teams.away.starters] };
    const bench: Record<Side, SimPlayer[]> = { home: [...teams.home.bench], away: [...teams.away.bench] };
    const yellows = new Set<string>();
    const reds: Record<Side, number> = { home: 0, away: 0 };
    const score = { home: 0, away: 0 };

    const events: SimEvent[] = [];
    let counter = 0;

    // Remplacements : 3 à 5 par équipe, groupés sur 2-3 fenêtres en seconde période.
    const subPlan: Record<Side, Map<number, number>> = { home: new Map(), away: new Map() };
    for (const side of ["home", "away"] as const) {
      if (bench[side].length === 0) continue;
      const windows = rng.shuffle([56, 60, 64, 68, 71, 75, 79, 84]).slice(0, rng.int(2, 3));
      let remaining = Math.min(rng.int(3, 5), bench[side].length);
      windows.forEach((minute, i) => {
        const n = i === windows.length - 1 ? remaining : Math.min(remaining, rng.int(1, 2));
        if (n <= 0) return;
        remaining -= n;
        const t = halfTimeAt + (minute - 45) - 1;
        subPlan[side].set(t, (subPlan[side].get(t) ?? 0) + n);
      });
    }

    // Momentum : processus autorégressif tiré vers le rapport de forces.
    const bias = clamp(((lambda.home - lambda.away) / (lambda.home + lambda.away)) * 1.2, -0.6, 0.6);
    let momentum = bias;

    const clock = (k: number) => {
      const period: 1 | 2 = k < halfTimeAt ? 1 : 2;
      const raw = period === 1 ? k + 1 : 45 + (k - halfTimeAt) + 1;
      const cap = period === 1 ? 45 : 90;
      return raw > cap ? { period, minute: cap, addedTime: raw - cap } : { period, minute: raw };
    };

    const push = (
      t: number,
      type: SimEventType,
      team: Side | null,
      importance: EventImportance,
      text: string,
      extra: Partial<SimEvent> = {},
    ): SimEvent => {
      const k = Math.min(Math.floor(t), duration - 1);
      const event: SimEvent = { id: `e${++counter}`, t, ...clock(k), team, type, importance, text, ...extra };
      events.push(event);
      return event;
    };

    const name = (p: SimPlayer | undefined, side: Side) => p?.shortName ?? teams[side].name;
    const outfield = (side: Side) => onPitch[side].filter((p) => p.position !== "GK");
    const keeper = (side: Side) => onPitch[side].find((p) => p.position === "GK");
    const scoreText = () => `${teams.home.name} ${score.home}-${score.away} ${teams.away.name}`;

    const frames: MinuteFrame[] = [];
    const frameAt = (k: number, possessionHome: number): MinuteFrame => {
      const remaining = Math.max(0, duration - k) / 90;
      const attack = (side: Side) =>
        lambda[side] * RED_CARD_ATTACK_FACTOR ** reds[side] * (1 / RED_CARD_ATTACK_FACTOR) ** (reds[other(side)] * 0.5);
      return {
        t: k,
        momentum,
        possessionHome,
        winProbability: outcomeProbabilities(score, attack("home") * remaining, attack("away") * remaining),
      };
    };

    frames.push(frameAt(0, 50 + bias * 12));
    push(0, "kickoff", "home", 2, commentary(rng, "kickoff", { team: teams.home.name }));

    for (let k = 0; k < duration; k++) {
      if (k === halfTimeAt) {
        push(halfTimeAt + 0.02, "kickoff", "away", 2, commentary(rng, "secondHalf", {}));
      }

      momentum = clamp(0.8 * momentum + 0.2 * bias + 0.28 * rng.normal(), -1, 1);
      const possessionHome = clamp(50 + momentum * 14 + rng.normal() * 3, 25, 75);

      for (const side of ["home", "away"] as const) {
        const sideMomentum = side === "home" ? momentum : -momentum;
        const opp = other(side);
        const minuteStart = () => k + rng.range(0.05, 0.95);

        // --- Tirs ------------------------------------------------------------
        const redFactor = RED_CARD_ATTACK_FACTOR ** reds[side] * (1 / RED_CARD_ATTACK_FACTOR) ** (reds[opp] * 0.5);
        const shotRate = Math.max(0.01, (lambda[side] / MEAN_SHOT_XG / 90) * (1 + 0.8 * sideMomentum) * redFactor);
        if (rng.chance(shotRate)) {
          const t = minuteStart();
          const big = rng.chance(BIG_CHANCE_RATE);
          const xg = Math.round(drawXg(rng, big) * 100) / 100;
          const shooter = rng.weighted(onPitch[side], (p) => SCORER_WEIGHT[p.position] * (1 + p.seasonGoals * 0.3));
          const p = name(shooter, side);

          if (rng.chance(xg)) {
            const assister = rng.chance(ASSIST_RATE)
              ? rng.weighted(
                  onPitch[side].filter((pl) => pl.id !== shooter?.id),
                  (pl) => ASSIST_WEIGHT[pl.position] * (1 + pl.seasonAssists * 0.3),
                )
              : undefined;
            score[side] += 1;
            const text =
              commentary(rng, "goal", { p }) + (assister ? commentary(rng, "assist", { a: assister.shortName }) : "");
            const goal = push(t, "goal", side, 2, text, {
              playerId: shooter?.id,
              secondaryPlayerId: assister?.id,
              xg,
            });
            // L'équipe menée réagit.
            momentum = clamp(momentum + (side === "home" ? -0.35 : 0.35), -1, 1);

            if (rng.chance(VAR_CHECK_RATE)) {
              const overturned = rng.chance(VAR_OVERTURN_RATE);
              if (overturned) score[side] -= 1;
              push(
                Math.min(t + 0.6, k + 0.99),
                "var",
                side,
                2,
                commentary(rng, overturned ? "varOverturned" : "varConfirmed", { p }),
                { varTargetId: goal.id, varOverturned: overturned, playerId: shooter?.id },
              );
            }
          } else if (rng.chance(ON_TARGET_RATE)) {
            const gk = keeper(opp);
            push(t, "save", side, 1, commentary(rng, "save", { p, gk: name(gk, opp) }), {
              playerId: shooter?.id,
              secondaryPlayerId: gk?.id,
              xg,
            });
            if (rng.chance(0.3)) push(t + 0.3, "corner", side, 0, commentary(rng, "corner", { team: teams[side].name }));
          } else {
            push(t, big ? "big_chance" : "shot", side, big ? 2 : 1, commentary(rng, big ? "bigChance" : "shot", { p }), {
              playerId: shooter?.id,
              xg,
            });
          }
        }

        // --- Corners & hors-jeu ---------------------------------------------
        if (rng.chance(0.045 * (1 + 0.5 * sideMomentum))) {
          push(minuteStart(), "corner", side, 0, commentary(rng, "corner", { team: teams[side].name }));
        }
        if (rng.chance(0.02 * (1 + 0.4 * sideMomentum))) {
          const p = rng.weighted(onPitch[side], (pl) => (pl.position === "FWD" ? 4 : pl.position === "MID" ? 1 : 0.1));
          push(minuteStart(), "offside", side, 0, commentary(rng, "offside", { p: name(p, side) }), { playerId: p?.id });
        }

        // --- Fautes & cartons (l'équipe sous pression fait davantage faute) --
        if (rng.chance(0.11 * (1 - 0.3 * sideMomentum))) {
          const t = minuteStart();
          const fouler = rng.weighted(outfield(side), (pl) => FOUL_WEIGHT[pl.position]);
          const victim = rng.pick(onPitch[opp].length ? onPitch[opp] : [undefined]);
          const tokens = { p: name(fouler, side), v: name(victim, opp) };
          const extra = { playerId: fouler?.id, secondaryPlayerId: victim?.id };
          const sendOff = () => {
            reds[side] += 1;
            if (fouler) onPitch[side] = onPitch[side].filter((pl) => pl.id !== fouler.id);
            momentum = clamp(momentum + (side === "home" ? -0.3 : 0.3), -1, 1);
          };

          if (rng.chance(STRAIGHT_RED_PER_FOUL)) {
            push(t, "red", side, 2, commentary(rng, "red", tokens), extra);
            sendOff();
          } else if (rng.chance(YELLOW_PER_FOUL)) {
            if (fouler && yellows.has(fouler.id)) {
              push(t, "red", side, 2, commentary(rng, "secondYellow", tokens), extra);
              sendOff();
            } else {
              if (fouler) yellows.add(fouler.id);
              push(t, "yellow", side, 1, commentary(rng, "yellow", tokens), extra);
            }
          } else {
            push(t, "foul", side, 0, commentary(rng, "foul", tokens), extra);
          }
        }

        // --- Remplacements ---------------------------------------------------
        const subs = subPlan[side].get(k) ?? 0;
        for (let i = 0; i < subs; i++) {
          const out = rng.weighted(outfield(side), (pl) => SUB_OUT_WEIGHT[pl.position]);
          if (!out || bench[side].length === 0) break;
          const samePosition = bench[side].filter((pl) => pl.position === out.position);
          const incoming = rng.pick(samePosition.length ? samePosition : bench[side].filter((pl) => pl.position !== "GK"));
          if (!incoming) break;
          bench[side] = bench[side].filter((pl) => pl.id !== incoming.id);
          onPitch[side] = onPitch[side].map((pl) => (pl.id === out.id ? incoming : pl));
          push(
            k + 0.5 + i * 0.01,
            "substitution",
            side,
            1,
            commentary(rng, "substitution", { team: teams[side].name, in: incoming.shortName, out: out.shortName }),
            { playerId: incoming.id, secondaryPlayerId: out.id },
          );
        }
      }

      if (k + 1 === halfTimeAt) {
        push(halfTimeAt, "half_time", null, 2, commentary(rng, "halfTime", { score: scoreText() }), {
          period: 1,
          minute: 45,
          addedTime: added.first,
        });
      }
      frames.push(frameAt(k + 1, possessionHome));
    }

    push(duration, "full_time", null, 2, commentary(rng, "fullTime", { score: scoreText() }));

    events.sort((a, b) => a.t - b.t);

    return {
      engineId: "placeholder",
      seed,
      input,
      events,
      addedTime: added,
      halfTimeAt,
      duration,
      frames,
    };
  },
};
