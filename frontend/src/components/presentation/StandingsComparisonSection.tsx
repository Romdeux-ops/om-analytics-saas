"use client";

import { memo } from "react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { StandingRow } from "@/src/lib/types/standing";

interface StandingsComparisonSectionProps {
  homeStanding?: StandingRow;
  awayStanding?: StandingRow;
  homeTeamName: string;
  awayTeamName: string;
  competition?: "ligue1" | "europa" | "coupe";
}

function zoneStatus(standing: StandingRow, isEuropa: boolean): string {
  if (isEuropa) {
    if (standing.rank <= 8) return "Top 8 · 8es de finale directs";
    if (standing.rank <= 24) return "Barragiste (16es de finale)";
    return "Zone d'élimination (25e-36e)";
  }
  if (standing.rank >= 16) return "Zone rouge / Barrage";
  if (standing.rank <= 5) return "Places européennes";
  return "Milieu de tableau";
}

const diffOf = (s: StandingRow) => s.goalsFor - s.goalsAgainst;
const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

/** Fiche comparative ligne à ligne : domicile à gauche, extérieur à droite. */
export const StandingsComparisonSection = memo(function StandingsComparisonSection({
  homeStanding,
  awayStanding,
  homeTeamName,
  awayTeamName,
  competition = "ligue1",
}: StandingsComparisonSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);
  const isEuropa = competition === "europa";

  const gap =
    homeStanding && awayStanding ? Math.abs(homeStanding.points - awayStanding.points) : null;

  return (
    <section>
      <SectionHeading
        index="02"
        title={`Classement ${isEuropa ? "Europa League" : "Ligue 1"}`}
        subtitle={
          isEuropa
            ? "Phase de ligue UEFA (36 clubs) · position officielle"
            : "Position officielle, points et bilan des deux clubs"
        }
        action={gap !== null ? <span className="bg-ink px-2 py-1 text-paper">Écart : {gap} pt{gap > 1 ? "s" : ""}</span> : undefined}
      />

      {!homeStanding || !awayStanding ? (
        <p className="editorial py-6 text-lg text-ink/60">
          Données de classement non disponibles pour {!homeStanding ? homeShort : awayShort}.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end border-b-[6px] border-ink pb-3">
            <ClubHead standing={homeStanding} label={homeShort} align="left" isEuropa={isEuropa} />
            <span className="editorial px-4 pb-2 text-xl text-ink/60">contre</span>
            <ClubHead standing={awayStanding} label={awayShort} align="right" isEuropa={isEuropa} />
          </div>

          <dl>
            <CompareRow label="Points" home={homeStanding.points} away={awayStanding.points} higherIsBetter />
            <CompareRow label="Joués" home={homeStanding.played} away={awayStanding.played} />
            <CompareRow label="Victoires" home={homeStanding.won} away={awayStanding.won} higherIsBetter />
            <CompareRow label="Nuls" home={homeStanding.drawn} away={awayStanding.drawn} />
            <CompareRow label="Défaites" home={homeStanding.lost} away={awayStanding.lost} higherIsBetter={false} />
            <CompareRow label="Buts pour" home={homeStanding.goalsFor} away={awayStanding.goalsFor} higherIsBetter />
            <CompareRow label="Buts contre" home={homeStanding.goalsAgainst} away={awayStanding.goalsAgainst} higherIsBetter={false} />
            <CompareRow
              label="Différence"
              home={diffOf(homeStanding)}
              away={diffOf(awayStanding)}
              format={signed}
              higherIsBetter
            />
          </dl>
        </>
      )}
    </section>
  );
});

function ClubHead({
  standing,
  label,
  align,
  isEuropa,
}: {
  standing: StandingRow;
  label: string;
  align: "left" | "right";
  isEuropa: boolean;
}) {
  return (
    <div className={cn("min-w-0 [overflow-wrap:anywhere]", align === "right" && "text-right")}>
      <p className="label text-ink/60">{zoneStatus(standing, isEuropa)}</p>
      <p className="mt-1 flex items-baseline gap-3" style={{ justifyContent: align === "right" ? "flex-end" : undefined }}>
        <span className={cn("display text-5xl md:text-7xl", isOmTeam(standing.clubName) ? "text-accent-text" : "text-ink")}>
          {label}
        </span>
        <span className="display text-3xl tabular text-ink/40 md:text-5xl">{standing.rank}e</span>
      </p>
    </div>
  );
}

function CompareRow({
  label,
  home,
  away,
  higherIsBetter,
  format = String,
}: {
  label: string;
  home: number;
  away: number;
  /** undefined : pas de mise en avant */
  higherIsBetter?: boolean;
  format?: (n: number) => string;
}) {
  const homeLead = higherIsBetter === undefined ? false : higherIsBetter ? home > away : home < away;
  const awayLead = higherIsBetter === undefined ? false : higherIsBetter ? away > home : away < home;
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-ink/20">
      <dd className={cn("display py-1.5 pl-2 text-2xl tabular", homeLead && "bg-ink text-paper")}>{format(home)}</dd>
      <dt className="label px-4 text-center text-ink/60">{label}</dt>
      <dd className={cn("display py-1.5 pr-2 text-right text-2xl tabular", awayLead && "bg-ink text-paper")}>{format(away)}</dd>
    </div>
  );
}
