import { ChevronRight, ListOrdered } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import {
  DiffCell,
  PointsCell,
  RankBadge,
  TeamCell,
} from "@/src/components/classement/standing-cells";
import { getStandings } from "@/src/lib/data/standings";
import { getCompetition } from "@/src/lib/data/competitions";
import { shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow } from "@/src/lib/types/standing";

const CARD_GRID =
  "grid grid-cols-[2rem_1fr_auto] gap-x-3 sm:grid-cols-[2rem_1fr_2.5rem_3rem_auto]";

function StandingLine({ row }: { row: StandingRow }) {
  const diff = row.goalsFor - row.goalsAgainst;
  return (
    <li
      className={cn(
        CARD_GRID,
        "items-center rounded-xl px-2 py-2 transition-colors",
        row.isOm ? "om-highlight" : "hover:bg-white/[0.04]",
      )}
    >
      <RankBadge rank={row.rank} isOm={row.isOm} />
      <TeamCell clubName={row.clubName} isOm={row.isOm} label={shortTeamName(row.clubName)} />
      <span className="hidden text-center text-xs tabular-nums text-slate-500 sm:block">
        {row.played}
      </span>
      <DiffCell diff={diff} className="hidden sm:block" />
      <PointsCell points={row.points} isOm={row.isOm} className="min-w-[2.25rem]" />
    </li>
  );
}

export function StandingsCard() {
  const standings = getStandings(5);
  const season = getCompetition("ligue1").season;

  return (
    <Card href="/classement" className="flex h-full flex-col">
      <SectionHeading
        title="Classement"
        subtitle={`Ligue 1 · ${season}`}
        icon={<ListOrdered size={16} />}
        action={
          <span className="flex items-center gap-1 text-xs font-medium text-cyan-300 transition-all group-hover:gap-2">
            Voir tout <ChevronRight size={14} />
          </span>
        }
      />

      <div className="flex flex-1 flex-col">
        <div
          className={cn(
            CARD_GRID,
            "mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400",
          )}
        >
          <span>#</span>
          <span>Club</span>
          <span className="hidden text-center sm:block">J</span>
          <span className="hidden text-center sm:block">Diff</span>
          <span className="text-right">Pts</span>
        </div>

        <ul className="space-y-0.5">
          {standings.map((row) => (
            <StandingLine key={row.clubName} row={row} />
          ))}
        </ul>

        <p className="mt-auto pt-4 text-[10px] uppercase tracking-widest text-slate-600">
          Classement pré-saison — top 5
        </p>
      </div>
    </Card>
  );
}
