import {
  DiffCell,
  PointsCell,
  RankBadge,
  TeamCell,
  ZoneBar,
  ZONE_META,
} from "@/src/components/classement/standing-cells";
import { fullTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow, StandingZone } from "@/src/lib/types/standing";

const ROW_GRID =
  "grid min-w-[36rem] grid-cols-[0.375rem_2.5rem_minmax(10rem,1fr)_2.25rem_2.25rem_2.25rem_2.25rem_2.5rem_2.5rem_3rem_3.5rem] items-center gap-x-2";

function StandingLine({ row, zoneStart }: { row: StandingRow; zoneStart: boolean }) {
  const diff = row.goalsFor - row.goalsAgainst;
  return (
    <li
      className={cn(
        ROW_GRID,
        "pr-3 transition-colors duration-100",
        zoneStart ? "border-t-[3px] border-ink" : "border-t border-ink/15",
        row.isOm ? "om-highlight" : "hover:bg-ink hover:text-paper",
      )}
    >
      <ZoneBar zone={row.zone} />
      <span className="py-2.5">
        <RankBadge rank={row.rank} />
      </span>
      <TeamCell clubName={row.clubName} isOm={row.isOm} label={fullTeamName(row.clubName)} />
      <span className="text-center text-xs tabular">{row.played}</span>
      <span className="text-center text-xs tabular">{row.won}</span>
      <span className="text-center text-xs tabular">{row.drawn}</span>
      <span className="text-center text-xs tabular">{row.lost}</span>
      <span className="text-center text-xs tabular opacity-70">{row.goalsFor}</span>
      <span className="text-center text-xs tabular opacity-70">{row.goalsAgainst}</span>
      <DiffCell diff={diff} />
      <PointsCell points={row.points} />
    </li>
  );
}

/** Légende des zones présentes dans le classement, dans l'ordre de première apparition. */
function ZoneLegend({ standings }: { standings: readonly StandingRow[] }) {
  const zones: StandingZone[] = [];
  for (const row of standings) {
    if (row.zone && !zones.includes(row.zone)) zones.push(row.zone);
  }
  if (zones.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {zones.map((zone) => (
        <span key={zone} className="label flex items-center gap-2 text-ink/70">
          <ZoneBar zone={zone} className="h-3.5" />
          {ZONE_META[zone].label}
        </span>
      ))}
    </div>
  );
}

interface StandingsTableProps {
  standings: readonly StandingRow[];
  title: string;
  season: string;
  badgeLabel: string;
}

export function StandingsTable({ standings, title, season, badgeLabel }: StandingsTableProps) {
  return (
    <section className="flex flex-col">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-4xl text-ink md:text-6xl">
          {title} <span className="text-accent-text">{season}</span>
        </h2>
        <span className="label border border-ink bg-ink px-2 py-1 text-paper">{badgeLabel}</span>
      </div>

      <div className="no-scrollbar overflow-x-auto border-t-[6px] border-ink">
        <div className={cn(ROW_GRID, "label border-b border-ink py-2 pr-3 text-ink/60")}>
          <span />
          <span className="text-right">#</span>
          <span>Club</span>
          <span className="text-center">J</span>
          <span className="text-center">G</span>
          <span className="text-center">N</span>
          <span className="text-center">P</span>
          <span className="text-center">BP</span>
          <span className="text-center">BC</span>
          <span className="text-center">Diff</span>
          <span className="text-right">Pts</span>
        </div>

        <ul className="border-b border-ink">
          {standings.map((row, i) => (
            <StandingLine
              key={row.clubName}
              row={row}
              zoneStart={i > 0 && row.zone !== standings[i - 1].zone}
            />
          ))}
        </ul>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <ZoneLegend standings={standings} />
        <p className="label text-ink/50">{standings.length} clubs</p>
      </div>
    </section>
  );
}
