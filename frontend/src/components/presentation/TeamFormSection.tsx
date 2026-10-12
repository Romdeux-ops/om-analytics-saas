"use client";

import { memo } from "react";
import { Activity, ShieldCheck, Flame, ArrowUpRight } from "lucide-react";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { TeamFormData, FormMatchItem } from "@/src/lib/data/team-form";

interface TeamFormSectionProps {
  homeForm: TeamFormData;
  awayForm: TeamFormData;
  homeTeamName: string;
  awayTeamName: string;
  competition?: "ligue1" | "europa" | "coupe";
}

export const TeamFormSection = memo(function TeamFormSection({
  homeForm,
  awayForm,
  homeTeamName,
  awayTeamName,
  competition = "ligue1",
}: TeamFormSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);
  const isEuropa = competition === "europa";
  const compLabel = isEuropa ? "Europa League" : "Ligue 1";
  const matchCount = Math.max(homeForm.matches.length, awayForm.matches.length);

  return (
    <section className="space-y-4">
      {/* En-tête de section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
              isEuropa
                ? "border-orange-400/20 bg-orange-500/10 text-orange-400"
                : "border-cyan-400/20 bg-cyan-500/10 text-cyan-400"
            }`}
          >
            <Activity size={16} />
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              Forme Récente des Deux Équipes
            </h3>
            <p className="text-xs text-slate-400">
              {matchCount > 0 ? `${matchCount} match${matchCount > 1 ? "s" : ""} disputé${matchCount > 1 ? "s" : ""}` : "Rencontres"} ·{" "}
              <strong className={isEuropa ? "text-orange-300" : "text-cyan-300"}>
                {compLabel} uniquement
              </strong>
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold ${
            isEuropa
              ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
              : "border-cyan-400/30 bg-cyan-500/10 text-cyan-300"
          }`}
        >
          <ShieldCheck size={12} />
          Filtré {compLabel} 2026/27
        </span>
      </div>

      {/* Cartes comparatives côte à côte */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TeamFormCard teamName={homeShort} form={homeForm} isHome isEuropa={isEuropa} />
        <TeamFormCard teamName={awayShort} form={awayForm} isHome={false} isEuropa={isEuropa} />
      </div>

      {/* Barre comparative statistique */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-xl">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Face-à-face statistique en {compLabel}
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatComparisonItem
            label={isEuropa ? "Points pris" : "Points pris (sur 15)"}
            homeVal={`${homeForm.points} pts`}
            awayVal={`${awayForm.points} pts`}
            homeLead={homeForm.points > awayForm.points}
            awayLead={awayForm.points > homeForm.points}
          />
          <StatComparisonItem
            label="Bilan (V - N - D)"
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
            label="Différence de buts"
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

function TeamFormCard({
  teamName,
  form,
  isHome,
  isEuropa = false,
}: {
  teamName: string;
  form: TeamFormData;
  isHome: boolean;
  isEuropa?: boolean;
}) {
  const maxPoints = form.matches.length * 3;
  const pointsText = isEuropa
    ? `${form.points} pt${form.points > 1 ? "s" : ""}${maxPoints > 0 ? ` (sur ${maxPoints})` : ""}`
    : `${form.points}/15 points`;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <TeamCrest name={form.canonicalName} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-tech text-lg font-black uppercase text-white">
                {teamName}
              </h4>
              <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {isHome ? "Domicile" : "Extérieur"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {form.wins}V {form.draws}N {form.losses}D · {pointsText}
            </p>
          </div>
        </div>

        {/* Pastilles de forme */}
        <div className="flex items-center gap-1.5">
          {form.formSequence.map((res, i) => (
            <ResultBadge key={i} result={res} size="md" />
          ))}
        </div>
      </div>

      {/* Liste des matchs */}
      <div className="mt-4 space-y-2">
        {form.matches.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-500">
            {isEuropa
              ? "Aucun match d'Europa League enregistré pour le moment."
              : "Aucun match de Ligue 1 enregistré pour le moment."}
          </p>
        ) : (
          form.matches.map((m) => <MatchHistoryRow key={m.id} match={m} />)
        )}
      </div>
    </div>
  );
}

function MatchHistoryRow({ match }: { match: FormMatchItem }) {
  const matchDate = new Date(match.date);
  const formattedDate = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
  }).format(matchDate);

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.05]">
      <div className="flex items-center gap-2.5 min-w-0">
        <ResultBadge result={match.result} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase text-slate-500">
              {match.isHome ? "vs" : "@"}
            </span>
            <span className="truncate text-xs font-semibold text-slate-200">
              {match.opponentShort}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            {formattedDate} · {match.competition || "Ligue 1"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono text-xs font-bold text-white">
          {match.scoreFormatted}
        </span>
      </div>
    </div>
  );
}

function ResultBadge({
  result,
  size = "md",
}: {
  result: "V" | "N" | "D";
  size?: "sm" | "md";
}) {
  const isV = result === "V";
  const isN = result === "N";

  const sizeClass = size === "sm" ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs";

  return (
    <span
      className={`flex items-center justify-center rounded-lg font-black shrink-0 ${sizeClass} ${
        isV
          ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
          : isN
            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
            : "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
      }`}
      title={isV ? "Victoire" : isN ? "Match nul" : "Défaite"}
    >
      {result}
    </span>
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
    <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-center">
      <span className="block text-[10px] uppercase tracking-wider text-slate-400 mb-1">
        {label}
      </span>
      <div className="flex items-center justify-center gap-2 font-mono text-sm font-bold">
        <span className={homeLead ? "text-cyan-300 font-extrabold" : "text-slate-300"}>
          {homeVal}
        </span>
        <span className="text-slate-600">/</span>
        <span className={awayLead ? "text-cyan-300 font-extrabold" : "text-slate-300"}>
          {awayVal}
        </span>
      </div>
    </div>
  );
}
