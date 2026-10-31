"use client";

import { memo } from "react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { ResultMark } from "@/src/components/ui/ResultMark";
import { isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { TeamFormData, FormMatchItem } from "@/src/lib/data/team-form";

interface TeamFormSectionProps {
  homeForm: TeamFormData;
  awayForm: TeamFormData;
  homeTeamName: string;
  awayTeamName: string;
  competition?: "ligue1" | "europa" | "coupe";
  /** Format court, ex. "2026/27". */
  season: string;
}

export const TeamFormSection = memo(function TeamFormSection({
  homeForm,
  awayForm,
  homeTeamName,
  awayTeamName,
  competition = "ligue1",
  season,
}: TeamFormSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);
  const isEuropa = competition === "europa";
  const compLabel = isEuropa ? "Europa League" : "Ligue 1";
  const matchCount = Math.max(homeForm.matches.length, awayForm.matches.length);

  return (
    <section>
      <SectionHeading
        index="01"
        title="La forme du moment"
        subtitle={`${matchCount > 0 ? `${matchCount} match${matchCount > 1 ? "s" : ""}` : "Rencontres"} · ${compLabel} uniquement`}
        action={<span className="bg-ink px-2 py-1 text-paper">Filtré {compLabel} {season}</span>}
      />

      <div className="grid md:grid-cols-2">
        <TeamFormColumn teamName={homeShort} canonical={homeTeamName} form={homeForm} isHome isEuropa={isEuropa} />
        <TeamFormColumn teamName={awayShort} canonical={awayTeamName} form={awayForm} isHome={false} isEuropa={isEuropa} />
      </div>

      <div className="mt-8 border-t-[6px] border-ink">
        <p className="label border-b border-ink py-2 text-ink/60">Face-à-face statistique en {compLabel}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4">
          <StatComparisonItem
            label={isEuropa ? "Points pris" : "Points (sur 15)"}
            homeVal={homeForm.points}
            awayVal={awayForm.points}
            homeLead={homeForm.points > awayForm.points}
            awayLead={awayForm.points > homeForm.points}
          />
          <StatComparisonItem
            label="Bilan V-N-D"
            homeVal={`${homeForm.wins}-${homeForm.draws}-${homeForm.losses}`}
            awayVal={`${awayForm.wins}-${awayForm.draws}-${awayForm.losses}`}
            homeLead={homeForm.wins > awayForm.wins}
            awayLead={awayForm.wins > homeForm.wins}
          />
          <StatComparisonItem
            label="Buts marqués"
            homeVal={homeForm.goalsFor}
            awayVal={awayForm.goalsFor}
            homeLead={homeForm.goalsFor > awayForm.goalsFor}
            awayLead={awayForm.goalsFor > homeForm.goalsFor}
          />
          <StatComparisonItem
            label="Diff. de buts"
            homeVal={homeForm.goalDiff > 0 ? `+${homeForm.goalDiff}` : `${homeForm.goalDiff}`}
            awayVal={awayForm.goalDiff > 0 ? `+${awayForm.goalDiff}` : `${awayForm.goalDiff}`}
            homeLead={homeForm.goalDiff > awayForm.goalDiff}
            awayLead={awayForm.goalDiff > homeForm.goalDiff}
          />
        </div>
      </div>
    </section>
  );
});

function TeamFormColumn({
  teamName,
  canonical,
  form,
  isHome,
  isEuropa = false,
}: {
  teamName: string;
  canonical: string;
  form: TeamFormData;
  isHome: boolean;
  isEuropa?: boolean;
}) {
  const maxPoints = form.matches.length * 3;
  const pointsText = isEuropa
    ? `${form.points} pt${form.points > 1 ? "s" : ""}${maxPoints > 0 ? ` (sur ${maxPoints})` : ""}`
    : `${form.points}/15 points`;

  return (
    <div className={cn("py-2", isHome ? "md:border-r md:border-ink md:pr-8" : "mt-8 md:mt-0 md:pl-8")}>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="label text-ink/60">{isHome ? "Domicile" : "Extérieur"}</p>
          <h4 className={cn("display mt-1 text-5xl [overflow-wrap:anywhere] md:text-6xl", isOmTeam(canonical) ? "text-accent-text" : "text-ink")}>
            {teamName}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          {form.formSequence.map((res, i) => (
            <ResultMark key={i} result={res} />
          ))}
        </div>
      </div>
      <p className="label mt-2 border-b border-ink pb-2 text-ink/60">
        {form.wins}V {form.draws}N {form.losses}D · {pointsText}
      </p>

      <ul>
        {form.matches.length === 0 ? (
          <li className="editorial py-6 text-lg text-ink/60">
            {isEuropa
              ? "Aucun match d'Europa League enregistré pour le moment."
              : "Aucun match de Ligue 1 enregistré pour le moment."}
          </li>
        ) : (
          form.matches.map((m) => <MatchHistoryRow key={m.id} match={m} />)
        )}
      </ul>
    </div>
  );
}

function MatchHistoryRow({ match }: { match: FormMatchItem }) {
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(match.date));

  return (
    <li className="grid grid-cols-[1.25rem_3rem_1fr_auto] items-center gap-3 border-b border-ink/15 py-2 transition-colors duration-100 hover:bg-ink hover:text-paper">
      <ResultMark result={match.result} size="sm" />
      <span className="text-[11px] tabular opacity-60">{formattedDate}</span>
      <span className="min-w-0 truncate text-xs font-bold uppercase">
        <span className="mr-1.5 opacity-50">{match.isHome ? "vs" : "@"}</span>
        {match.opponentShort}
      </span>
      <span className="display text-xl tabular">{match.scoreFormatted}</span>
    </li>
  );
}

function StatComparisonItem({
  label,
  homeVal,
  awayVal,
  homeLead,
  awayLead,
}: {
  label: string;
  homeVal: string | number;
  awayVal: string | number;
  homeLead: boolean;
  awayLead: boolean;
}) {
  return (
    <div className="border-b border-r border-ink/25 p-3 last:border-r-0">
      <span className="label block text-ink/60">{label}</span>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("display text-3xl tabular", homeLead ? "text-ink underline decoration-accent decoration-4 underline-offset-4" : "text-ink/50")}>
          {homeVal}
        </span>
        <span className="text-ink/30">/</span>
        <span className={cn("display text-3xl tabular", awayLead ? "text-ink underline decoration-accent decoration-4 underline-offset-4" : "text-ink/50")}>
          {awayVal}
        </span>
      </div>
    </div>
  );
}
