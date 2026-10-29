import Link from "next/link";
import {
  DiffCell,
  PointsCell,
  RankBadge,
  TeamCell,
  ZoneBar,
} from "@/src/components/classement/standing-cells";
import { getStandings, standingsAroundOm } from "@/src/lib/data/standings";
import { getCompetition, standingsMatchday } from "@/src/lib/data/competitions";
import { shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow } from "@/src/lib/types/standing";

const CARD_GRID = "grid grid-cols-[0.375rem_2rem_1fr_2rem_2.5rem_2.75rem] items-center gap-x-2";

function StandingLine({ row }: { row: StandingRow }) {
  const diff = row.goalsFor - row.goalsAgainst;
  return (
    <li className={cn(CARD_GRID, "border-b border-ink/15 pr-2", row.isOm && "om-highlight")}>
      <ZoneBar zone={row.zone} />
      <span className="py-2">
        <RankBadge rank={row.rank} />
      </span>
      <TeamCell clubName={row.clubName} isOm={row.isOm} label={shortTeamName(row.clubName)} />
      <span className="text-center text-xs tabular opacity-70">{row.played}</span>
      <DiffCell diff={diff} />
      <PointsCell points={row.points} />
    </li>
  );
}

export async function StandingsCard() {
  const allStandings = await getStandings();
  const standings = standingsAroundOm(allStandings);
  const matchday = standingsMatchday(allStandings);
  const season = getCompetition("ligue1").season;

  return (
    <section className="flex h-full flex-col border-t-[6px] border-ink pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="label text-ink/60">
          <span className="text-accent-text">02</span> — Classement
        </p>
        <p className="label text-ink/60">Ligue 1 · {season}</p>
      </div>

      <h2 className="display mt-3 text-5xl text-ink md:text-6xl">Autour de l&apos;OM</h2>

      <div className="mt-5">
        <div className={cn(CARD_GRID, "label border-b border-ink pb-1.5 pr-2 text-ink/60")}>
          <span />
          <span className="text-right">#</span>
          <span>Club</span>
          <span className="text-center">J</span>
          <span className="text-center">+/-</span>
          <span className="text-right">Pts</span>
        </div>
        <ul>
          {standings.map((row) => (
            <StandingLine key={row.clubName} row={row} />
          ))}
        </ul>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <p className="label text-ink/50">Après J{matchday}</p>
        <Link
          href="/classement"
          prefetch
          className="label inline-flex items-center gap-2 border border-ink px-3 py-2 text-ink invert-hover"
        >
          Classement complet <span className="arrow">→</span>
        </Link>
      </div>
    </section>
  );
}
