"use client";

import { memo } from "react";
import { ListOrdered, Trophy, ArrowRight, ShieldAlert } from "lucide-react";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { StandingRow } from "@/src/lib/types/standing";

interface StandingsComparisonSectionProps {
  homeStanding?: StandingRow;
  awayStanding?: StandingRow;
  homeTeamName: string;
  awayTeamName: string;
  competition?: "ligue1" | "europa" | "coupe";
}

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

  return (
    <section className="space-y-4">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-400">
            <ListOrdered size={16} />
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              Classement {isEuropa ? "Europa League" : "Ligue 1"}
            </h3>
            <p className="text-xs text-slate-400">
              {isEuropa
                ? "Phase de ligue UEFA (36 clubs) · Position officielle et qualification"
                : "Position officielle, points et bilan des deux clubs"}
            </p>
          </div>
        </div>

        {homeStanding && awayStanding && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300">
            Écart : {Math.abs(homeStanding.points - awayStanding.points)} point{Math.abs(homeStanding.points - awayStanding.points) > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Cartes comparatives */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <ClubStandingCard standing={homeStanding} teamName={homeShort} isHome isEuropa={isEuropa} />
        <ClubStandingCard standing={awayStanding} teamName={awayShort} isHome={false} isEuropa={isEuropa} />
      </div>

      {/* Tableau détaillé comparatif */}
      {homeStanding && awayStanding && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 pl-4 pr-2">Club</th>
                  <th className="py-3 px-2 text-center">Rang</th>
                  <th className="py-3 px-2 text-center">Points</th>
                  <th className="py-3 px-2 text-center">Joués</th>
                  <th className="py-3 px-2 text-center">V</th>
                  <th className="py-3 px-2 text-center">N</th>
                  <th className="py-3 px-2 text-center">D</th>
                  <th className="py-3 px-2 text-center">BP</th>
                  <th className="py-3 px-2 text-center">BC</th>
                  <th className="py-3 pr-4 pl-2 text-center">Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr className="transition-colors hover:bg-white/[0.03]">
                  <td className="py-3 pl-4 pr-2 font-sans font-bold text-white flex items-center gap-2">
                    <TeamCrest name={homeStanding.clubName} size="sm" className="h-6 w-6 text-[9px] rounded-md" />
                    <span>{homeShort}</span>
                    <span className="text-[9px] uppercase text-cyan-400 font-semibold">(Dom.)</span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-amber-300">
                    {homeStanding.rank}e
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-white">
                    {homeStanding.points}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300">{homeStanding.played}</td>
                  <td className="py-3 px-2 text-center text-emerald-400">{homeStanding.won}</td>
                  <td className="py-3 px-2 text-center text-amber-400">{homeStanding.drawn}</td>
                  <td className="py-3 px-2 text-center text-red-400">{homeStanding.lost}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{homeStanding.goalsFor}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{homeStanding.goalsAgainst}</td>
                  <td className={`py-3 pr-4 pl-2 text-center font-bold ${
                    homeStanding.goalsFor - homeStanding.goalsAgainst > 0
                      ? "text-emerald-400"
                      : homeStanding.goalsFor - homeStanding.goalsAgainst < 0
                        ? "text-red-400"
                        : "text-slate-400"
                  }`}>
                    {homeStanding.goalsFor - homeStanding.goalsAgainst > 0
                      ? `+${homeStanding.goalsFor - homeStanding.goalsAgainst}`
                      : homeStanding.goalsFor - homeStanding.goalsAgainst}
                  </td>
                </tr>

                <tr className="transition-colors hover:bg-white/[0.03]">
                  <td className="py-3 pl-4 pr-2 font-sans font-bold text-white flex items-center gap-2">
                    <TeamCrest name={awayStanding.clubName} size="sm" className="h-6 w-6 text-[9px] rounded-md" />
                    <span>{awayShort}</span>
                    <span className="text-[9px] uppercase text-slate-400 font-semibold">(Ext.)</span>
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-amber-300">
                    {awayStanding.rank}e
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-white">
                    {awayStanding.points}
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300">{awayStanding.played}</td>
                  <td className="py-3 px-2 text-center text-emerald-400">{awayStanding.won}</td>
                  <td className="py-3 px-2 text-center text-amber-400">{awayStanding.drawn}</td>
                  <td className="py-3 px-2 text-center text-red-400">{awayStanding.lost}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{awayStanding.goalsFor}</td>
                  <td className="py-3 px-2 text-center text-slate-300">{awayStanding.goalsAgainst}</td>
                  <td className={`py-3 pr-4 pl-2 text-center font-bold ${
                    awayStanding.goalsFor - awayStanding.goalsAgainst > 0
                      ? "text-emerald-400"
                      : awayStanding.goalsFor - awayStanding.goalsAgainst < 0
                        ? "text-red-400"
                        : "text-slate-400"
                  }`}>
                    {awayStanding.goalsFor - awayStanding.goalsAgainst > 0
                      ? `+${awayStanding.goalsFor - awayStanding.goalsAgainst}`
                      : awayStanding.goalsFor - awayStanding.goalsAgainst}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
});

function ClubStandingCard({
  standing,
  teamName,
  isHome,
  isEuropa = false,
}: {
  standing?: StandingRow;
  teamName: string;
  isHome: boolean;
  isEuropa?: boolean;
}) {
  if (!standing) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center text-xs text-slate-500">
        Données de classement non disponibles pour {teamName}.
      </div>
    );
  }

  const isRelegation = standing.rank >= 16;
  const isEurope = standing.rank <= 5;
  const isUefaDirect = isEuropa && standing.rank <= 8;
  const isUefaPlayoffs = isEuropa && standing.rank >= 9 && standing.rank <= 24;
  const isUefaEliminated = isEuropa && standing.rank >= 25;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 backdrop-blur-xl shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TeamCrest name={standing.clubName} size="md" />
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
              {standing.played} match{standing.played > 1 ? "s" : ""} joué{standing.played > 1 ? "s" : ""} · Diff. {standing.goalsFor - standing.goalsAgainst > 0 ? `+${standing.goalsFor - standing.goalsAgainst}` : standing.goalsFor - standing.goalsAgainst}
            </p>
          </div>
        </div>

        {/* Gros badge Rang & Points */}
        <div className="text-right">
          <span className="font-tech text-3xl font-black text-amber-300 leading-none">
            {standing.rank}
            <span className="text-base font-normal text-amber-300/80">e</span>
          </span>
          <span className="block text-xs font-bold text-white font-mono mt-0.5">
            {standing.points} pts
          </span>
        </div>
      </div>

      {/* Zone indicator */}
      <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-black/20 px-3 py-2 text-xs">
        <span className="text-slate-400 text-[11px]">
          {isEuropa ? "Statut UEFA (Phase de ligue) :" : "Statut en championnat :"}
        </span>
        {isEuropa ? (
          isUefaDirect ? (
            <span className="flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
              <Trophy size={12} /> Top 8 · 8es de finale directs
            </span>
          ) : isUefaPlayoffs ? (
            <span className="flex items-center gap-1 font-bold text-cyan-400 text-[11px]">
              <ShieldAlert size={12} className="text-cyan-400" /> Barragiste (16es de finale)
            </span>
          ) : (
            <span className="flex items-center gap-1 font-bold text-red-400 text-[11px]">
              <ShieldAlert size={12} /> Zone d&apos;élimination (25e-36e)
            </span>
          )
        ) : isRelegation ? (
          <span className="flex items-center gap-1 font-bold text-red-400 text-[11px]">
            <ShieldAlert size={12} /> Zone rouge / Barrage
          </span>
        ) : isEurope ? (
          <span className="flex items-center gap-1 font-bold text-emerald-400 text-[11px]">
            <Trophy size={12} /> Places européennes
          </span>
        ) : (
          <span className="font-semibold text-slate-300 text-[11px]">
            Milieu de tableau
          </span>
        )}
      </div>
    </div>
  );
}
