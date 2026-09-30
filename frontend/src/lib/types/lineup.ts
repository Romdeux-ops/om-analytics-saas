// ---------------------------------------------------------------------------
// Types pour le système de compositions probables
// ---------------------------------------------------------------------------

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface RosterPlayer {
  id: string;
  displayName: string;
  shortName: string;
  jersey: number | null;
  position: PlayerPosition;
  positionLabel: string;
  age: number;
  nationality: string;
  headshotUrl: string | null;
  appearances: number;
  subIns: number;
  starts: number;
  goals: number;
  assists: number;
  saves: number;
  isInjured: boolean;
}

export type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "3-4-3";

export interface LineupSlot {
  player: RosterPlayer;
  role: string;
  x: number;
  y: number;
}

export interface ProbableLineup {
  formation: Formation;
  starters: LineupSlot[];
  substitutes: RosterPlayer[];
}

export interface MatchLineups {
  home: ProbableLineup;
  away: ProbableLineup;
  homeTeam: string;
  awayTeam: string;
}
