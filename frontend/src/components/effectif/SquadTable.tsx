import { formatSeason } from "@om/db/season";
import type { PlayerView } from "@/src/lib/types/player";
import { cn } from "@/src/lib/ui/cn";
import { formatMarketValue, groupPlayersByPosition } from "@/src/lib/ui/market-value";

/** Fiche joueur façon vignette d'album : numéro géant en filigrane, stats en pied. */
function PlayerCard({ player, featured }: { player: PlayerView; featured: boolean }) {
  return (
    <li
      className={cn(
        "group relative flex min-h-[11rem] flex-col justify-between overflow-hidden border-b border-r border-ink p-4 transition-colors duration-100 hover:bg-ink hover:text-paper",
        featured && "sm:col-span-2",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "display pointer-events-none absolute -right-2 -top-3 leading-none text-ink/10 transition-colors duration-100 group-hover:text-accent-inverse",
          featured ? "text-[11rem]" : "text-[8rem]",
        )}
      >
        {player.jerseyNumber ?? ""}
      </span>

      <div className="relative">
        <p className="label text-ink/50 group-hover:text-paper/60">
          N°{player.jerseyNumber ?? "—"} · {player.positionLabel}
        </p>
        <p className={cn("display mt-2 leading-[0.9]", featured ? "text-5xl" : "text-3xl")}>{player.name}</p>
      </div>

      <dl className="relative mt-4 grid grid-cols-4 gap-2 border-t border-current pt-2 text-[11px] tabular">
        <div>
          <dt className="label opacity-60">Âge</dt>
          <dd className="font-bold">{player.age}</dd>
        </div>
        <div>
          <dt className="label opacity-60">MJ</dt>
          <dd className="font-bold">{player.matchesPlayed}</dd>
        </div>
        <div>
          <dt className="label opacity-60">B/PD</dt>
          <dd className="font-bold">
            {player.goals}/{player.assists}
          </dd>
        </div>
        <div className="text-right">
          <dt className="label opacity-60">Valeur</dt>
          <dd className="font-bold text-accent-text group-hover:text-accent-inverse">
            {formatMarketValue(player.marketValue)}
          </dd>
        </div>
      </dl>
    </li>
  );
}

interface SquadTableProps {
  players: readonly PlayerView[];
  season?: string;
  /** Dernière journée de Ligue 1 jouée ; 0 avant la reprise. */
  matchday?: number;
}

export function SquadTable({ players, season = formatSeason(), matchday = 0 }: SquadTableProps) {
  const groups = groupPlayersByPosition(players);

  return (
    <section className="flex flex-col">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-4xl text-ink md:text-6xl">
          L&apos;album <span className="text-accent-text">{season}</span>
        </h2>
        <span className="label border border-ink bg-ink px-2 py-1 text-paper">{players.length} joueurs</span>
      </div>

      <div className="space-y-12">
        {Array.from(groups.entries()).map(([groupLabel, groupPlayers]) => (
          <section
            key={groupLabel}
            aria-labelledby={`group-${groupLabel}`}
            className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[4rem_1fr]"
          >
            <h3
              id={`group-${groupLabel}`}
              className="display flex items-start justify-center border-r-[6px] border-ink pr-2 text-3xl text-ink [writing-mode:vertical-rl] rotate-180 md:text-5xl"
            >
              {groupLabel}
            </h3>

            <ul className="grid grid-cols-1 border-l border-t border-ink sm:grid-cols-2 lg:grid-cols-4">
              {groupPlayers.map((player, i) => (
                <PlayerCard key={player.id} player={player} featured={i === 0 && groupPlayers.length > 2} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="label mt-10 border-t border-ink pt-3 text-ink/50">
        MJ = matchs joués · B = buts · PD = passes décisives
        {matchday > 0 && ` · Ligue 1 après J${matchday}`}
      </p>
    </section>
  );
}
