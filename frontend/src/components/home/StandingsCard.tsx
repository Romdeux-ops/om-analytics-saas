import { ChevronRight, ListOrdered } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { getStandings } from "@/src/lib/data/standings";
import { shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow } from "@/src/lib/types/standing";

function rankClasses(rank: number, isOm: boolean) {
  if (isOm) return "bg-cyan-500/20 text-cyan-200 border-cyan-400/40";
  if (rank === 1) return "bg-amber-400/20 text-amber-200 border-amber-300/40";
  if (rank <= 3) return "bg-white/10 text-slate-200 border-white/15";
  return "bg-white/[0.03] text-slate-400 border-white/10";
}

function StandingLine({ row }: { row: StandingRow }) {
  const diff = row.goalsFor - row.goalsAgainst;
  return (
    <li
      className={cn(
        "grid grid-cols-[2rem_1fr_auto] items-center gap-x-3 rounded-xl px-2 py-2 transition-colors sm:grid-cols-[2rem_1fr_2.5rem_3rem_auto]",
        row.isOm ? "om-highlight" : "hover:bg-white/[0.04]",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-lg border font-tech text-xs font-bold tabular-nums",
          rankClasses(row.rank, row.isOm),
        )}
      >
        {row.rank}
      </span>

      <span className="flex min-w-0 items-center gap-2.5">
        <TeamCrest name={row.clubName} size="sm" />
        <span
          className={cn(
            "truncate text-sm",
            row.isOm ? "font-bold text-white" : "font-medium text-slate-300",
          )}
        >
          {shortTeamName(row.clubName)}
        </span>
      </span>

      <span className="hidden text-center text-xs tabular-nums text-slate-500 sm:block">
        {row.played}
      </span>

      <span
        className={cn(
          "hidden text-center text-xs font-medium tabular-nums sm:block",
          diff > 0 ? "text-emerald-400" : diff < 0 ? "text-red-400" : "text-slate-500",
        )}
      >
        {diff > 0 ? `+${diff}` : diff}
      </span>

      <span
        className={cn(
          "min-w-[2.25rem] rounded-lg px-2 py-1 text-right font-tech text-base font-black tabular-nums",
          row.isOm ? "bg-cyan-500/15 text-cyan-200" : "text-white",
        )}
      >
        {row.points}
      </span>
    </li>
  );
}

export async function StandingsCard() {
  const standings = await getStandings(5);

  return (
    <Card href="/classement" className="flex h-full flex-col">
      <SectionHeading
        title="Classement"
        subtitle="Ligue 1 — Top 5"
        icon={<ListOrdered size={16} />}
        action={
          <span className="flex items-center gap-1 text-xs font-medium text-cyan-300 transition-all group-hover:gap-2">
            Voir tout <ChevronRight size={14} />
          </span>
        }
      />

      <div className="flex flex-1 flex-col">
        <div className="mb-1 grid grid-cols-[2rem_1fr_auto] gap-x-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 sm:grid-cols-[2rem_1fr_2.5rem_3rem_auto]">
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
          Données mock — mise à jour temps réel à venir
        </p>
      </div>
    </Card>
  );
}
