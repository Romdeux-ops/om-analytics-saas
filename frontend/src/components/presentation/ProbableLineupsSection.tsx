"use client";

import { memo, useState } from "react";
import { Users, Shirt, Shield, Layers } from "lucide-react";
import { LineupPitch, SubstitutesBench } from "@/src/components/simulation/LineupPitch";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { MatchLineups } from "@/src/lib/types/lineup";

interface ProbableLineupsSectionProps {
  lineups: MatchLineups | null;
  homeTeamName: string;
  awayTeamName: string;
}

export const ProbableLineupsSection = memo(function ProbableLineupsSection({
  lineups,
  homeTeamName,
  awayTeamName,
}: ProbableLineupsSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);

  const [activeTab, setActiveTab] = useState<"both" | "home" | "away">("both");

  return (
    <section className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
            <Users size={16} />
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              Compositions Probables &amp; Remplaçants
            </h3>
            <p className="text-xs text-slate-400">
              11 de départ probables, schémas tactiques et bancs complets
            </p>
          </div>
        </div>

        {/* Sélecteur de vue (Tous / Domicile / Extérieur) */}
        <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("both")}
            className={`rounded-lg px-3 py-1 font-bold transition-colors ${
              activeTab === "both"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Côte à côte
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`rounded-lg px-3 py-1 font-bold transition-colors ${
              activeTab === "home"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {homeShort}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("away")}
            className={`rounded-lg px-3 py-1 font-bold transition-colors ${
              activeTab === "away"
                ? "bg-cyan-500/20 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {awayShort}
          </button>
        </div>
      </div>

      {!lineups ? (
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-xs text-slate-500">
          <Shirt size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">
            Compositions en cours d&apos;ajustement tactique
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Les données d&apos;effectif sont synchronisées automatiquement avec les feuilles de match officielles.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            activeTab === "both"
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1 max-w-2xl mx-auto"
          }`}
        >
          {/* Équipe Domicile */}
          {(activeTab === "both" || activeTab === "home") && (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
                    Domicile
                  </span>
                  <span className="font-tech text-base font-black uppercase text-white">
                    {homeShort}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {lineups.home.formation}
                </span>
              </div>

              {/* Terrain avec les 11 titulaires */}
              <LineupPitch
                lineup={lineups.home}
                teamName={lineups.homeTeam}
              />

              {/* Banc des remplaçants */}
              <SubstitutesBench
                substitutes={lineups.home.substitutes}
                teamName={lineups.homeTeam}
              />
            </div>
          )}

          {/* Équipe Extérieur */}
          {(activeTab === "both" || activeTab === "away") && (
            <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.02] p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                    Extérieur
                  </span>
                  <span className="font-tech text-base font-black uppercase text-white">
                    {awayShort}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">
                  {lineups.away.formation}
                </span>
              </div>

              {/* Terrain avec les 11 titulaires */}
              <LineupPitch
                lineup={lineups.away}
                teamName={lineups.awayTeam}
              />

              {/* Banc des remplaçants */}
              <SubstitutesBench
                substitutes={lineups.away.substitutes}
                teamName={lineups.awayTeam}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
});
