"use client";

import { memo } from "react";
import { currentSeasonYear, formatSeason } from "@om/db/season";
import { ResultMark } from "@/src/components/ui/ResultMark";
import { shortTeamName, fullTeamName, isOmTeam } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";
import type { MatchPresentationData } from "@/src/lib/data/match-presentation";
import type { FormResultType } from "@/src/lib/data/team-form";

const PARIS_TZ = "Europe/Paris";

function formatMatchDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

interface MatchHeroBannerProps {
  data: MatchPresentationData;
  onLaunchSimulation: () => void;
}

/** Face-à-face en split-screen : deux moitiés séparées par la ligne médiane. */
export const MatchHeroBanner = memo(function MatchHeroBanner({
  data,
  onLaunchSimulation,
}: MatchHeroBannerProps) {
  const {
    match,
    stadium,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    competition,
    competitionLabel,
    matchday,
  } = data;
  const matchDate = new Date(match.date);

  return (
    <section className="border-y-[6px] border-ink">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink py-2.5">
        <p className="label">
          {competition === "europa" ? "Europa League" : "Ligue 1"} · J{matchday} ·{" "}
          {formatSeason(currentSeasonYear(matchDate))}
        </p>
        <p className="label text-ink/60">
          {stadium.name} · {stadium.city} · <span className="capitalize">{formatMatchDate(matchDate)}</span>
        </p>
      </div>

      <div className="relative grid md:grid-cols-2">
        <TeamHalf
          name={match.home_team_name}
          side="Domicile"
          align="left"
          standing={homeStanding ? `${homeStanding.rank}e · ${homeStanding.points} pts` : null}
          form={homeForm.formSequence}
          formTitle={`Forme (${competitionLabel})`}
        />
        <TeamHalf
          name={match.away_team_name}
          side="Extérieur"
          align="right"
          standing={awayStanding ? `${awayStanding.rank}e · ${awayStanding.points} pts` : null}
          form={awayForm.formSequence}
          formTitle={`Forme (${competitionLabel})`}
        />

        {/* Rond central */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 hidden h-28 w-28 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink bg-paper md:flex">
          <span className="editorial text-2xl text-ink/70">contre</span>
        </div>
      </div>

      <div className="flex flex-col items-start justify-between gap-3 border-t border-ink py-4 sm:flex-row sm:items-center">
        <p className="label text-ink/60">Avant-match</p>
        {data.isNextMatch ? (
          <button
            type="button"
            onClick={onLaunchSimulation}
            className="stamp label inline-flex items-center gap-3 border border-ink bg-accent px-6 py-3.5 text-sm text-on-accent"
          >
            Lancer la simulation <span className="arrow">→</span>
          </button>
        ) : (
          <span className="label border border-dashed border-ink px-4 py-2.5 text-ink/60">
            Simulation verrouillée — seul le prochain match peut être simulé
          </span>
        )}
      </div>
    </section>
  );
});

function TeamHalf({
  name,
  side,
  align,
  standing,
  form,
  formTitle,
}: {
  name: string;
  side: string;
  align: "left" | "right";
  standing: string | null;
  form: FormResultType[];
  formTitle: string;
}) {
  const om = isOmTeam(name);
  const label = shortTeamName(name);
  return (
    <div
      className={cn(
        "@container flex min-w-0 flex-col gap-4 py-8 md:py-12",
        align === "left" ? "md:border-r md:border-ink md:pr-20" : "border-t border-ink md:border-t-0 md:pl-20 md:text-right",
      )}
    >
      <p className="label text-ink/60">{side}</p>
      <h2
        className={cn("display [overflow-wrap:anywhere]", om ? "text-accent-text" : "text-ink")}
        // Taille calée sur la largeur de la moitié : un nom long (Olympiacos) rétrécit au lieu d'être coupé.
        style={{ fontSize: `min(10rem, ${Math.round(185 / Math.max(label.length, 3))}cqi)` }}
      >
        {label}
      </h2>
      <p className="label">{fullTeamName(name)}</p>
      <div className={cn("flex flex-wrap items-center gap-3", align === "right" && "md:justify-end")}>
        {standing && <span className="label bg-ink px-2 py-1 text-paper">{standing}</span>}
        <span className="flex items-center gap-1" title={formTitle}>
          {form.map((res, i) => (
            <ResultMark key={i} result={res} size="sm" />
          ))}
        </span>
      </div>
    </div>
  );
}
