"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Star } from "lucide-react";
import type { Side } from "@/src/lib/simulation";
import type { PlayerLive } from "@/src/lib/simulation/timeline";
import { cn } from "@/src/lib/ui/cn";
import { CardIcon, Swatch, type SideTones } from "./shared";

interface LiveRatingsProps {
  players: PlayerLive[];
  /** Notes dix minutes plus tôt, pour la tendance. */
  previous: Map<string, number>;
  bestId?: string;
  homeName: string;
  awayName: string;
  tones: SideTones;
  started: boolean;
}

type SortMode = "lineup" | "rating";

const POSITION_LABEL = { GK: "Gardien", DEF: "Déf.", MID: "Milieu", FWD: "Att." } as const;

export function LiveRatings({ players, previous, bestId, homeName, awayName, tones, started }: LiveRatingsProps) {
  const [sort, setSort] = useState<SortMode>("lineup");

  if (players.length === 0) {
    return (
      <p className="editorial text-xl text-ink/50">
        Compositions indisponibles : les actions sont attribuées aux clubs, sans notes individuelles.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="label text-ink/55">Note sur 10 · base 6,0 · tendance sur 10 min</p>
        <div className="flex border border-ink" role="group" aria-label="Trier les joueurs">
          {(
            [
              ["lineup", "Compo"],
              ["rating", "Note"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSort(id)}
              aria-pressed={sort === id}
              className={cn("label border-r border-ink px-2.5 py-1 last:border-r-0", sort === id ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {(["home", "away"] as const).map((side) => (
          <TeamRatings
            key={side}
            side={side}
            name={side === "home" ? homeName : awayName}
            tone={tones.bg[side]}
            players={players.filter((p) => p.side === side && (p.started || p.subbedOnLabel))}
            previous={previous}
            bestId={bestId}
            sort={sort}
            started={started}
          />
        ))}
      </div>
    </div>
  );
}

function TeamRatings({
  name,
  tone,
  players,
  previous,
  bestId,
  sort,
  started,
}: {
  side: Side;
  name: string;
  tone: string;
  players: PlayerLive[];
  previous: Map<string, number>;
  bestId?: string;
  sort: SortMode;
  started: boolean;
}) {
  const list = sort === "rating" ? [...players].sort((a, b) => b.rating - a.rating) : players;

  return (
    <div>
      <p className="label mb-2 flex items-center gap-1.5 border-b border-ink pb-1">
        <Swatch className={tone} /> {name}
      </p>
      <ul className="divide-y divide-ink/15">
        {list.map((pl) => {
          const before = previous.get(pl.player.id) ?? pl.rating;
          const trend = pl.rating - before;
          const best = started && pl.player.id === bestId;
          return (
            <li key={pl.player.id} className={cn("grid grid-cols-[1.75rem_1fr_auto] items-center gap-2 py-1.5", !pl.onPitch && "opacity-55")}>
              <span className={cn("display flex h-7 w-7 items-center justify-center text-sm leading-none tabular", tone, tone === "bg-accent" ? "text-on-accent" : "text-paper")}>
                {pl.player.jersey ?? "–"}
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[13px]">
                  <span className="truncate font-semibold uppercase">{pl.player.shortName}</span>
                  {best && (
                    <span className="label inline-flex shrink-0 items-center gap-1 bg-ink px-1 py-px text-paper" title="Homme du match (provisoire)">
                      <Star size={10} aria-hidden="true" /> HDM
                    </span>
                  )}
                </p>
                <p className="label flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink/55">
                  <span>{POSITION_LABEL[pl.player.position]}</span>
                  {pl.goals > 0 && <span className="text-ink">⚽ {pl.goals > 1 ? `×${pl.goals}` : ""}</span>}
                  {pl.assists > 0 && <span className="text-ink">Passe déc. {pl.assists > 1 ? `×${pl.assists}` : ""}</span>}
                  {pl.yellow && !pl.red && <CardIcon color="yellow" />}
                  {pl.red && <CardIcon color="red" />}
                  {pl.subbedOnLabel && <span>↑ {pl.subbedOnLabel}</span>}
                  {pl.subbedOffLabel && <span>↓ {pl.subbedOffLabel}</span>}
                </p>
              </div>
              <span className="flex items-center gap-1">
                {started && Math.abs(trend) >= 0.1 && (
                  <span className={cn("inline-flex", trend > 0 ? "text-ink" : "text-ink/45")} aria-label={trend > 0 ? "en hausse" : "en baisse"}>
                    {trend > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                  </span>
                )}
                <span
                  className={cn(
                    "display w-11 text-right text-2xl leading-none tabular",
                    pl.rating >= 7.5 ? "text-accent-text" : pl.rating < 5.5 ? "text-ink/50" : "",
                  )}
                >
                  {started ? pl.rating.toFixed(1) : "–"}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
