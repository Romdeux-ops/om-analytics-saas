/**
 * Relecture d'un match simulé à un instant t : score, statistiques cumulées,
 * notes joueurs… Tout est dérivé des événements, sans état caché : l'UI peut
 * « sauter » à n'importe quelle minute.
 */
import type { MinuteFrame, SimEvent, SimPlayer, SimulatedMatch, Side } from "./types";

export interface TeamLiveStats {
  shots: number;
  shotsOnTarget: number;
  xg: number;
  corners: number;
  fouls: number;
  yellow: number;
  red: number;
  offsides: number;
  /** Possession cumulée (0-100). */
  possession: number;
}

export interface GoalSummary {
  eventId: string;
  side: Side;
  playerName: string;
  label: string;
  annulled: boolean;
}

export interface PlayerLive {
  player: SimPlayer;
  side: Side;
  rating: number;
  goals: number;
  assists: number;
  yellow: boolean;
  red: boolean;
  started: boolean;
  onPitch: boolean;
  /** Minute d'entrée (remplaçant) ou de sortie. */
  subbedOnLabel?: string;
  subbedOffLabel?: string;
}

export interface LiveState {
  t: number;
  score: { home: number; away: number };
  goals: GoalSummary[];
  stats: Record<Side, TeamLiveStats>;
  frame: MinuteFrame;
  players: PlayerLive[];
}

const BASE_RATING = 6;

export function minuteLabel(event: Pick<SimEvent, "minute" | "addedTime">): string {
  return event.addedTime ? `${event.minute}+${event.addedTime}'` : `${event.minute}'`;
}

export type MatchPhase = "pre" | "first" | "half_time" | "second" | "full_time";

export interface MatchClock {
  phase: MatchPhase;
  /** Chrono façon télé : minutes et secondes depuis le début du match. */
  mm: number;
  ss: number;
  /** Minutes de temps additionnel annoncées si on est dedans, sinon 0. */
  addedTimeAnnounced: number;
  label: string;
}

export function matchClock(match: SimulatedMatch, t: number, started: boolean): MatchClock {
  if (!started || t <= 0) return { phase: "pre", mm: 0, ss: 0, addedTimeAnnounced: 0, label: "Avant-match" };
  if (t >= match.duration) {
    return { phase: "full_time", mm: 90 + match.addedTime.second, ss: 0, addedTimeAnnounced: 0, label: "Terminé" };
  }
  const firstHalf = t < match.halfTimeAt;
  const elapsed = firstHalf ? t : 45 + (t - match.halfTimeAt);
  const mm = Math.floor(elapsed);
  const ss = Math.floor((elapsed - mm) * 60);
  const regulation = firstHalf ? 45 : 90;
  return {
    phase: firstHalf ? "first" : "second",
    mm,
    ss,
    addedTimeAnnounced: elapsed >= regulation ? (firstHalf ? match.addedTime.first : match.addedTime.second) : 0,
    label: firstHalf ? "1re période" : "2e période",
  };
}

function emptyStats(): TeamLiveStats {
  return { shots: 0, shotsOnTarget: 0, xg: 0, corners: 0, fouls: 0, yellow: 0, red: 0, offsides: 0, possession: 50 };
}

export function frameAt(match: SimulatedMatch, t: number): MinuteFrame {
  const index = Math.min(match.frames.length - 1, Math.max(0, Math.floor(t)));
  return match.frames[index];
}

export function eventsUntil(match: SimulatedMatch, t: number): SimEvent[] {
  return match.events.filter((e) => e.t <= t);
}

export function stateAt(match: SimulatedMatch, t: number): LiveState {
  const { home, away } = match.input;
  const players = new Map<string, PlayerLive>();
  for (const [side, team] of [["home", home], ["away", away]] as const) {
    for (const p of team.starters) {
      players.set(p.id, { player: p, side, rating: BASE_RATING, goals: 0, assists: 0, yellow: false, red: false, started: true, onPitch: true });
    }
    for (const p of team.bench) {
      players.set(p.id, { player: p, side, rating: BASE_RATING, goals: 0, assists: 0, yellow: false, red: false, started: false, onPitch: false });
    }
  }

  const adjust = (id: string | undefined, delta: number) => {
    const pl = id ? players.get(id) : undefined;
    if (pl) pl.rating += delta;
  };
  const onPitchOf = (side: Side) => [...players.values()].filter((pl) => pl.side === side && pl.onPitch);

  /** Effets d'un but sur les notes ; `sign = -1` pour l'annuler (VAR). */
  const applyGoal = (event: SimEvent, sign: 1 | -1) => {
    const side = event.team as Side;
    const scorer = event.playerId ? players.get(event.playerId) : undefined;
    const assister = event.secondaryPlayerId ? players.get(event.secondaryPlayerId) : undefined;
    if (scorer) {
      scorer.goals += sign;
      scorer.rating += sign * 1.0;
    }
    if (assister) {
      assister.assists += sign;
      assister.rating += sign * 0.6;
    }
    for (const pl of onPitchOf(side)) pl.rating += sign * 0.1;
    for (const pl of onPitchOf(side === "home" ? "away" : "home")) {
      const malus = pl.player.position === "GK" ? 0.35 : pl.player.position === "DEF" ? 0.2 : 0.05;
      pl.rating -= sign * malus;
    }
  };

  const score = { home: 0, away: 0 };
  const stats: Record<Side, TeamLiveStats> = { home: emptyStats(), away: emptyStats() };
  const goals: GoalSummary[] = [];
  const goalEvents = new Map<string, SimEvent>();

  for (const event of match.events) {
    if (event.t > t) break;
    const side = event.team;
    const s = side ? stats[side] : undefined;

    switch (event.type) {
      case "goal":
        if (!side || !s) break;
        score[side] += 1;
        s.shots += 1;
        s.shotsOnTarget += 1;
        s.xg += event.xg ?? 0;
        goalEvents.set(event.id, event);
        goals.push({
          eventId: event.id,
          side,
          playerName: (event.playerId && players.get(event.playerId)?.player.shortName) || match.input[side].name,
          label: minuteLabel(event),
          annulled: false,
        });
        applyGoal(event, 1);
        break;
      case "var": {
        const target = event.varTargetId ? goalEvents.get(event.varTargetId) : undefined;
        if (event.varOverturned && target && target.team) {
          score[target.team] -= 1;
          const summary = goals.find((g) => g.eventId === target.id);
          if (summary) summary.annulled = true;
          applyGoal(target, -1);
        }
        break;
      }
      case "save":
        if (!s) break;
        s.shots += 1;
        s.shotsOnTarget += 1;
        s.xg += event.xg ?? 0;
        adjust(event.secondaryPlayerId, 0.3);
        adjust(event.playerId, 0.05);
        break;
      case "shot":
      case "big_chance":
        if (!s) break;
        s.shots += 1;
        s.xg += event.xg ?? 0;
        adjust(event.playerId, event.type === "big_chance" ? -0.3 : -0.05);
        break;
      case "corner":
        if (s) s.corners += 1;
        break;
      case "offside":
        if (s) s.offsides += 1;
        adjust(event.playerId, -0.05);
        break;
      case "foul":
        if (s) s.fouls += 1;
        adjust(event.playerId, -0.05);
        break;
      case "yellow": {
        if (s) {
          s.fouls += 1;
          s.yellow += 1;
        }
        const pl = event.playerId ? players.get(event.playerId) : undefined;
        if (pl) {
          pl.yellow = true;
          pl.rating -= 0.4;
        }
        break;
      }
      case "red": {
        if (s) {
          s.fouls += 1;
          s.red += 1;
        }
        const pl = event.playerId ? players.get(event.playerId) : undefined;
        if (pl) {
          pl.red = true;
          pl.onPitch = false;
          pl.rating -= 1.5;
        }
        break;
      }
      case "substitution": {
        const incoming = event.playerId ? players.get(event.playerId) : undefined;
        const outgoing = event.secondaryPlayerId ? players.get(event.secondaryPlayerId) : undefined;
        if (incoming) {
          incoming.onPitch = true;
          incoming.subbedOnLabel = minuteLabel(event);
        }
        if (outgoing) {
          outgoing.onPitch = false;
          outgoing.subbedOffLabel = minuteLabel(event);
        }
        break;
      }
      default:
        break;
    }
  }

  // Possession : moyenne des minutes jouées.
  const played = match.frames.slice(1, Math.max(1, Math.floor(t)) + 1);
  const possessionHome = played.length
    ? played.reduce((sum, f) => sum + f.possessionHome, 0) / played.length
    : match.frames[0].possessionHome;
  stats.home.possession = Math.round(possessionHome);
  stats.away.possession = 100 - stats.home.possession;
  stats.home.xg = Math.round(stats.home.xg * 100) / 100;
  stats.away.xg = Math.round(stats.away.xg * 100) / 100;

  for (const pl of players.values()) pl.rating = Math.min(10, Math.max(3, pl.rating));

  return { t, score, goals, stats, frame: frameAt(match, t), players: [...players.values()] };
}

/** Joueur le mieux noté parmi ceux qui ont joué (homme du match). */
export function bestPlayer(state: LiveState): PlayerLive | undefined {
  return state.players
    .filter((pl) => pl.started || pl.subbedOnLabel)
    .reduce<PlayerLive | undefined>((best, pl) => (!best || pl.rating > best.rating ? pl : best), undefined);
}
