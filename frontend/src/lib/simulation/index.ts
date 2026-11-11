import type { ProbableLineup, RosterPlayer } from "@/src/lib/types/lineup";
import type { StandingRow } from "@/src/lib/types/standing";
import { placeholderEngine } from "./engines/placeholder";
import { Rng } from "./rng";
import { strengthFromStanding } from "./strength";
import type { MatchSimulationInput, SimPlayer, SimTeam, SimulatedMatch, SimulationEngine } from "./types";

export type * from "./types";

/** Moteurs disponibles. Les moteurs du mémoire (Poisson, Markov, ML) viendront s'ajouter ici. */
export const ENGINES: readonly SimulationEngine[] = [placeholderEngine];
export const DEFAULT_ENGINE = placeholderEngine;

export function runSimulation(
  input: MatchSimulationInput,
  seed: number,
  engine: SimulationEngine = DEFAULT_ENGINE,
): SimulatedMatch {
  return engine.simulate(input, new Rng(seed), seed);
}

function toSimPlayer(p: RosterPlayer): SimPlayer {
  return {
    id: p.id,
    name: p.displayName,
    shortName: p.shortName,
    jersey: p.jersey,
    position: p.position,
    seasonGoals: p.goals,
    seasonAssists: p.assists,
  };
}

export function buildSimTeam(name: string, standing?: StandingRow, lineup?: ProbableLineup | null): SimTeam {
  return {
    name,
    strength: strengthFromStanding(standing),
    starters: lineup?.starters.map((slot) => toSimPlayer(slot.player)) ?? [],
    bench: lineup?.substitutes.map(toSimPlayer) ?? [],
  };
}

/**
 * Temps de lecture d'un autre match calé sur celui du match principal,
 * période par période (tous les matchs de la journée vont à la pause ensemble).
 */
export function syncedTime(main: SimulatedMatch, other: SimulatedMatch, t: number): number {
  if (t >= main.duration) return other.duration;
  if (t < main.halfTimeAt) return Math.min(t, other.halfTimeAt);
  const secondHalfElapsed = t - main.halfTimeAt;
  return Math.min(other.halfTimeAt + secondHalfElapsed, other.duration - 0.001);
}

/** Inverse de `syncedTime` : instant du match principal où survient un événement d'un autre match. */
export function toMainTime(main: SimulatedMatch, other: SimulatedMatch, t: number): number {
  if (t >= other.duration) return main.duration;
  if (t < other.halfTimeAt) return Math.min(t, main.halfTimeAt - 0.01);
  return Math.min(main.halfTimeAt + (t - other.halfTimeAt), main.duration - 0.01);
}
