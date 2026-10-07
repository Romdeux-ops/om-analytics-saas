"use client";

import { useState } from "react";
import {
  FileText,
  Play,
  ArrowLeft,
  Sparkles,
  Swords,
  ChevronRight,
} from "lucide-react";
import type { MatchPresentationData } from "@/src/lib/data/match-presentation";
import { MatchHeroBanner } from "@/src/components/presentation/MatchHeroBanner";
import { TeamFormSection } from "@/src/components/presentation/TeamFormSection";
import { StandingsComparisonSection } from "@/src/components/presentation/StandingsComparisonSection";
import { MatchEditorialSection } from "@/src/components/presentation/MatchEditorialSection";
import { CoachesFaceOffSection } from "@/src/components/presentation/CoachesFaceOffSection";
import { ProbableLineupsSection } from "@/src/components/presentation/ProbableLineupsSection";
import MatchLiveInterface from "@/src/components/match/MatchLiveInterface";
import { shortTeamName } from "@/src/lib/ui/teams";

interface MatchPresentationViewProps {
  data: MatchPresentationData;
}

export function MatchPresentationView({ data }: MatchPresentationViewProps) {
  // Par défaut, l'utilisateur arrive sur la Présentation du match
  const [activeTab, setActiveTab] = useState<"presentation" | "simulation">(
    "presentation",
  );

  const homeShort = shortTeamName(data.match.home_team_name);
  const awayShort = shortTeamName(data.match.away_team_name);

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8">
      {/* Barre de navigation entre Présentation et Simulateur */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] p-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("presentation")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "presentation"
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-md ring-1 ring-cyan-400/40"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <FileText size={14} />
              <span>Présentation du Match</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("simulation")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === "simulation"
                  ? "bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Play size={13} className="fill-current" />
              <span>Simulateur Live</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-tech text-sm font-bold text-white uppercase">
            {homeShort} vs {awayShort}
          </span>
          <span className="text-slate-600">·</span>
          <span>Saison 2026/27</span>
        </div>
      </div>

      {activeTab === "presentation" ? (
        <div className="space-y-10 animate-fade-in">
          {/* 1. Hero Banner principal de présentation */}
          <MatchHeroBanner
            data={data}
            onLaunchSimulation={() => setActiveTab("simulation")}
          />

          {/* 2. Forme des deux équipes (5 derniers matchs Ligue 1 uniquement) */}
          <TeamFormSection
            homeForm={data.homeForm}
            awayForm={data.awayForm}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
          />

          {/* 3. Classement officiel des deux équipes */}
          <StandingsComparisonSection
            homeStanding={data.homeStanding}
            awayStanding={data.awayStanding}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
          />

          {/* 4. Article de présentation / Scraping presse & Analyse */}
          <MatchEditorialSection editorial={data.editorialPreview} />

          {/* 5. Le Duel des Entraîneurs / Coachs */}
          <CoachesFaceOffSection
            homeCoach={data.homeCoach}
            awayCoach={data.awayCoach}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
          />

          {/* 6. Compositions probables & Bancs */}
          <ProbableLineupsSection
            lineups={data.lineups}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
          />

          {/* CTA Bas de page pour basculer sur la simulation */}
          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-purple-950/30 p-8 text-center shadow-2xl backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-radial-gradient from-cyan-500/10 to-transparent" />
            <div className="relative z-10 max-w-xl mx-auto space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Sparkles size={13} />
                Prêt pour le coup d&apos;envoi
              </span>
              <h3 className="font-tech text-2xl font-black uppercase text-white md:text-3xl">
                Lancer la Simulation de la Rencontre
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed md:text-sm">
                Activez le moteur de calcul prédictif avec génération d&apos;actions minute par minute, xG en direct et suivi des performances joueurs.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("simulation");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 px-7 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-xl shadow-cyan-500/30 transition-transform hover:scale-105"
                >
                  <Play size={15} className="fill-current" />
                  <span>Accéder au Simulateur Live</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Bouton retour vers la présentation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("presentation")}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Retour à la présentation du match</span>
            </button>
          </div>

          {/* Interface de simulation en direct */}
          <MatchLiveInterface matchData={data.match} />
        </div>
      )}
    </div>
  );
}
