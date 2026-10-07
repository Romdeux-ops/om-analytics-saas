"use client";

import { memo } from "react";
import { UserCheck, Shield, Compass, Swords, Award } from "lucide-react";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { CoachProfile } from "@/src/lib/data/coaches";

interface CoachesFaceOffSectionProps {
  homeCoach: CoachProfile;
  awayCoach: CoachProfile;
  homeTeamName: string;
  awayTeamName: string;
}

export const CoachesFaceOffSection = memo(function CoachesFaceOffSection({
  homeCoach,
  awayCoach,
  homeTeamName,
  awayTeamName,
}: CoachesFaceOffSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);

  return (
    <section className="space-y-4">
      {/* En-tête de section */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
            <UserCheck size={16} />
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              Le Duel des Entraîneurs
            </h3>
            <p className="text-xs text-slate-400">
              Philosophies tactiques, schémas préférentiels et confrontation des styles
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300">
          <Swords size={12} className="text-cyan-400" />
          Bataille des bancs
        </span>
      </div>

      {/* Cartes des deux entraîneurs côte à côte */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CoachCard coach={homeCoach} teamName={homeShort} isHome />
        <CoachCard coach={awayCoach} teamName={awayShort} isHome={false} />
      </div>
    </section>
  );
});

function CoachCard({
  coach,
  teamName,
  isHome,
}: {
  coach: CoachProfile;
  teamName: string;
  isHome: boolean;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-xl shadow-xl">
      {/* Halo d'ambiance */}
      <div
        className={`pointer-events-none absolute -top-16 ${
          isHome ? "-left-16 bg-cyan-500/10" : "-right-16 bg-blue-600/10"
        } h-40 w-40 rounded-full blur-3xl`}
      />

      <div className="relative z-10">
        {/* Entête du coach */}
        <div className="flex items-start justify-between border-b border-white/5 pb-5">
          <div className="flex items-center gap-4">
            {/* Avatar Stylisé */}
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
              <UserCheck size={28} className="text-cyan-400" />
              <div className="absolute -bottom-1 -right-1">
                <TeamCrest name={coach.club} size="sm" className="h-6 w-6 text-[9px] rounded-md" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cyan-400">
                  {isHome ? "Domicile" : "Extérieur"}
                </span>
                {coach.nationality && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    {coach.nationality}
                  </span>
                )}
                {coach.age && (
                  <span className="text-[10px] text-slate-500">
                    · {coach.age} ans
                  </span>
                )}
              </div>

              <h4 className="mt-1 font-tech text-xl font-black uppercase text-white md:text-2xl">
                {coach.name}
              </h4>
              <p className="text-xs text-slate-400 font-medium">
                {coach.role} · {teamName}
              </p>
            </div>
          </div>

          {/* Système préférentiel */}
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">
              Système
            </span>
            <span className="mt-0.5 inline-block rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 font-mono text-xs font-bold text-cyan-300">
              {coach.system}
            </span>
          </div>
        </div>

        {/* Détails tactiques */}
        <div className="mt-5 space-y-3.5">
          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Compass size={12} className="text-cyan-400" />
              Style de jeu prédominant
            </span>
            <p className="rounded-xl border border-white/5 bg-black/20 p-2.5 text-xs font-semibold text-slate-200">
              {coach.style}
            </p>
          </div>

          <div>
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Shield size={12} className="text-cyan-400" />
              Principes &amp; Philosophie
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {coach.philosophy}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
