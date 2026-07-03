import { Users } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import type { PlayerView } from "@/src/lib/types/player";
import { cn } from "@/src/lib/ui/cn";
import { formatMarketValue, groupPlayersByPosition } from "@/src/lib/ui/market-value";

const ROW_GRID =
  "grid min-w-[36rem] grid-cols-[2.5rem_minmax(8rem,1.2fr)_minmax(6rem,1fr)_2rem_2rem_2rem_2.5rem_3.5rem] gap-x-2 sm:min-w-0 sm:grid-cols-[2.5rem_minmax(9rem,1.2fr)_minmax(7rem,1fr)_2rem_2rem_2rem_2.5rem_3.5rem]";

function PlayerLine({ player }: { player: PlayerView }) {
  return (
    <li
      className={cn(
        ROW_GRID,
        "items-center rounded-xl px-2 py-2.5 transition-colors om-highlight",
      )}
    >
      <span className="text-center font-tech text-sm font-bold tabular-nums text-slate-400">
        {player.jerseyNumber ?? "—"}
      </span>
      <span className="flex min-w-0 items-center gap-2.5">
        <TeamCrest name="Marseille" size="sm" />
        <span className="truncate text-sm font-bold text-white">{player.name}</span>
      </span>
      <span className="truncate text-xs text-slate-400">{player.positionLabel}</span>
      <span className="text-center text-xs tabular-nums text-slate-400">{player.age}</span>
      <span className="text-center text-xs tabular-nums text-slate-500">
        {player.matchesPlayed}
      </span>
      <span className="text-center text-xs tabular-nums text-slate-500">{player.goals}</span>
      <span className="text-center text-xs tabular-nums text-slate-500">{player.assists}</span>
      <span className="text-right text-xs font-semibold tabular-nums text-cyan-200">
        {formatMarketValue(player.marketValue)}
      </span>
    </li>
  );
}

interface SquadTableProps {
  players: readonly PlayerView[];
  season?: string;
}

export function SquadTable({ players, season = "2026-2027" }: SquadTableProps) {
  const groups = groupPlayersByPosition(players);

  return (
    <Card className="flex flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-tech text-lg font-black uppercase tracking-tight text-white">
            Effectif <span className="text-slate-500">·</span>{" "}
            <span className="text-gradient">OM</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {players.length} joueurs · Saison {season}
          </p>
        </div>
        <Badge variant="om">
          <Users size={10} />
          Ligue 1
        </Badge>
      </div>

      <div className="space-y-8">
        {Array.from(groups.entries()).map(([groupLabel, groupPlayers]) => (
          <section key={groupLabel} aria-labelledby={`group-${groupLabel}`}>
            <h3
              id={`group-${groupLabel}`}
              className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500"
            >
              {groupLabel}
            </h3>

            <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
              <div
                className={cn(
                  ROW_GRID,
                  "mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400",
                )}
              >
                <span className="text-center">N°</span>
                <span>Joueur</span>
                <span>Poste</span>
                <span className="text-center">Âge</span>
                <span className="text-center">MJ</span>
                <span className="text-center">B</span>
                <span className="text-center">PD</span>
                <span className="text-right">Valeur</span>
              </div>

              <ul className="space-y-0.5">
                {groupPlayers.map((player) => (
                  <PlayerLine key={player.id} player={player} />
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 border-t border-white/5 pt-4 text-[10px] uppercase tracking-widest text-slate-600">
        MJ = matchs joués · B = buts · PD = passes décisives · Stats à venir
      </p>
    </Card>
  );
}
