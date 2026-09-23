import { CalendarClock } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import {
  DiffCell,
  PointsCell,
  RankBadge,
  TeamCell,
  ZONE_META,
} from "@/src/components/classement/standing-cells";
import { fullTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow, StandingZone } from "@/src/lib/types/standing";

const ROW_GRID =
  "grid min-w-[32rem] grid-cols-[2rem_minmax(8rem,1fr)_2rem_2rem_2rem_2rem_2.5rem_2.5rem_2.5rem_3rem] gap-x-2 sm:min-w-0 sm:grid-cols-[2rem_minmax(10rem,1fr)_2rem_2rem_2rem_2rem_2.5rem_2.5rem_2.5rem_3rem]";

function StandingLine({ row }: { row: StandingRow }) {
  const diff = row.goalsFor - row.goalsAgainst;
  return (
    <li
      className={cn(
        ROW_GRID,
        "items-center rounded-xl px-2 py-2",
        row.isOm && "om-highlight",
      )}
    >
      <RankBadge rank={row.rank} isOm={row.isOm} zone={row.zone} />
      <TeamCell clubName={row.clubName} isOm={row.isOm} label={fullTeamName(row.clubName)} />
      <span className="text-center text-xs tabular-nums text-slate-500">{row.played}</span>
      <span className="text-center text-xs tabular-nums text-slate-400">{row.won}</span>
      <span className="text-center text-xs tabular-nums text-slate-400">{row.drawn}</span>
      <span className="text-center text-xs tabular-nums text-slate-400">{row.lost}</span>
      <span className="text-center text-xs tabular-nums text-slate-500">{row.goalsFor}</span>
      <span className="text-center text-xs tabular-nums text-slate-500">{row.goalsAgainst}</span>
      <DiffCell diff={diff} />
      <PointsCell points={row.points} isOm={row.isOm} />
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
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {zones.map((zone) => (
        <span key={zone} className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <span className={cn("h-2 w-2 rounded-full", ZONE_META[zone].dot)} />
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
    <Card className="flex flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-tech text-lg font-black uppercase tracking-tight text-white">
            {title} <span className="text-slate-500">·</span>{" "}
            <span className="text-gradient">{season}</span>
          </h2>
        </div>
        <Badge variant="gold">
          <CalendarClock size={10} />
          {badgeLabel}
        </Badge>
      </div>

      <div className="no-scrollbar -mx-2 overflow-x-auto px-2">
        <div
          className={cn(
            ROW_GRID,
            "mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400",
          )}
        >
          <span>#</span>
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

        <ul className="space-y-0.5">
          {standings.map((row) => (
            <StandingLine key={row.clubName} row={row} />
          ))}
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
        <ZoneLegend standings={standings} />
        <p className="text-[10px] uppercase tracking-widest text-slate-600">
          {standings.length} clubs
        </p>
      </div>
    </Card>
  );
}
