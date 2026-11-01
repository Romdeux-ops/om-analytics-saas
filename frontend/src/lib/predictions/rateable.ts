import type { MatchLineups, ProbableLineup } from "@/src/lib/types/lineup";
import { isOmTeam } from "@/src/lib/ui/teams";
import type { RateablePlayer } from "./types";

/** Clé de rapprochement entre noms ESPN (notes) et noms de l'effectif en base. */
export function normalizePlayerName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function omSide(lineups: MatchLineups): { teamName: string; lineup: ProbableLineup } | null {
  if (isOmTeam(lineups.homeTeam)) return { teamName: lineups.homeTeam, lineup: lineups.home };
  if (isOmTeam(lineups.awayTeam)) return { teamName: lineups.awayTeam, lineup: lineups.away };
  return null;
}

/** Joueurs OM notables : titulaires de la composition retenue, puis remplaçants. */
export function rateablePlayersFromLineups(lineups: MatchLineups | null): {
  teamName: string | null;
  players: RateablePlayer[];
} {
  const side = lineups ? omSide(lineups) : null;
  if (!side) return { teamName: null, players: [] };

  const seen = new Set<string>();
  const players: RateablePlayer[] = [];

  for (const slot of side.lineup.starters) {
    if (!slot.player.id || seen.has(slot.player.id)) continue;
    seen.add(slot.player.id);
    players.push({
      key: slot.player.id,
      name: slot.player.displayName || slot.player.shortName,
      shortName: slot.player.shortName || slot.player.displayName,
      jersey: slot.player.jersey,
      position: slot.player.position,
      role: slot.role,
      starter: true,
    });
  }

  for (const player of side.lineup.substitutes) {
    if (!player.id || seen.has(player.id)) continue;
    seen.add(player.id);
    players.push({
      key: player.id,
      name: player.displayName || player.shortName,
      shortName: player.shortName || player.displayName,
      jersey: player.jersey,
      position: player.position,
      role: null,
      starter: false,
    });
  }

  return { teamName: side.teamName, players };
}
