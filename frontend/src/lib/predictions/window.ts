import { currentSeasonYear } from "@om/db/season";
import {
  MAX_PREDICTED_GOALS,
  RATING_CLOSES_AFTER_MS,
  RATING_MAX,
  RATING_MIN,
  RATING_OPENS_AFTER_MS,
  RATING_STEP,
} from "./constants";
import type { RatingWindow } from "./types";

function toMs(date: Date | string): number {
  return new Date(date).getTime();
}

export function hasKickedOff(kickoff: Date | string, now = Date.now()): boolean {
  return now >= toMs(kickoff);
}

export function ratingWindowBounds(kickoff: Date | string): { opensAt: Date; closesAt: Date } {
  const start = toMs(kickoff);
  return {
    opensAt: new Date(start + RATING_OPENS_AFTER_MS),
    closesAt: new Date(start + RATING_CLOSES_AFTER_MS),
  };
}

export function ratingWindow(kickoff: Date | string, now = Date.now()): RatingWindow {
  const { opensAt, closesAt } = ratingWindowBounds(kickoff);
  if (now < opensAt.getTime()) return "upcoming";
  if (now < closesAt.getTime()) return "open";
  return "closed";
}

export function isValidGoalCount(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PREDICTED_GOALS;
}

export function isValidRating(value: number): boolean {
  return (
    Number.isFinite(value) &&
    value >= RATING_MIN &&
    value <= RATING_MAX &&
    Number.isInteger(value / RATING_STEP)
  );
}

/** Début de saison (1er juillet UTC), borne des classements « saison ». */
export function seasonStart(now = new Date()): Date {
  return new Date(Date.UTC(currentSeasonYear(now), 6, 1));
}

export function formatRating(value: number): string {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
