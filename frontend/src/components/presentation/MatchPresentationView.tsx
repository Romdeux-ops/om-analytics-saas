"use client";

import { useState } from "react";
import Link from "next/link";
import type { MatchPresentationData } from "@/src/lib/data/match-presentation";
import type { MatchLineups } from "@/src/lib/types/lineup";
import type { MatchEditorialPreview } from "@/src/lib/data/match-preview";
import { MatchHeroBanner } from "@/src/components/presentation/MatchHeroBanner";
import { TeamFormSection } from "@/src/components/presentation/TeamFormSection";
import { StandingsComparisonSection } from "@/src/components/presentation/StandingsComparisonSection";
import { MatchEditorialSection } from "@/src/components/presentation/MatchEditorialSection";
import { CoachesFaceOffSection } from "@/src/components/presentation/CoachesFaceOffSection";
import { ProbableLineupsSection } from "@/src/components/presentation/ProbableLineupsSection";
import MatchLiveInterface from "@/src/components/match/MatchLiveInterface";
import { shortTeamName } from "@/src/lib/ui/teams";
import { useAuth } from "@/src/components/auth/AuthProvider";

interface MatchPresentationViewProps {
  data: MatchPresentationData;
}

export function MatchPresentationView({ data }: MatchPresentationViewProps) {
  const { isAdmin } = useAuth();

  // État local réactif pour les compositions et les textes éditoriaux
  const [lineups, setLineups] = useState<MatchLineups | null>(data.lineups);
  const [editorial, setEditorial] = useState<MatchEditorialPreview>(data.editorialPreview);

  // Par défaut, l'utilisateur arrive sur la Présentation du match
  const [activeTab, setActiveTab] = useState<"presentation" | "simulation">(
    "presentation",
  );

  const homeShort = shortTeamName(data.match.home_team_name);
  const awayShort = shortTeamName(data.match.away_team_name);

  return (
    <div className="w-full space-y-10">
      {/* Bannière d'avertissement si match ultérieur non simulable */}
      {!data.isNextMatch && (
        <div className="flex flex-col justify-between gap-3 border border-dashed border-ink p-4 sm:flex-row sm:items-center">
          <p className="text-xs">
            <span className="label mr-2 bg-ink px-1.5 py-0.5 text-paper">Match futur verrouillé</span>
            Selon le règlement, seul le prochain match officiel au calendrier peut être simulé.
          </p>
          {data.nextMatchId && (
            <Link
              href={`/simulation/${data.nextMatchId}`}
              className="label inline-flex shrink-0 items-center gap-2 border border-ink px-3 py-2 invert-hover"
            >
              Aller au prochain match <span className="arrow">→</span>
            </Link>
          )}
        </div>
      )}

      {/* Barre de navigation entre Présentation et Simulateur */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink">
        <div className="flex items-end gap-1" role="tablist" aria-label="Vue du match">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "presentation"}
            onClick={() => setActiveTab("presentation")}
            className={`-mb-px border border-b-0 border-ink px-4 transition-all duration-100 ${
              activeTab === "presentation"
                ? "bg-ink py-3 text-paper"
                : "py-2 text-ink hover:bg-accent hover:py-3 hover:text-on-accent"
            }`}
          >
            <span className="label">01 · Présentation</span>
          </button>

          {data.isNextMatch ? (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "simulation"}
              onClick={() => setActiveTab("simulation")}
              className={`-mb-px border border-b-0 border-ink px-4 transition-all duration-100 ${
                activeTab === "simulation"
                  ? "bg-accent py-3 text-on-accent"
                  : "py-2 text-ink hover:bg-accent hover:py-3 hover:text-on-accent"
              }`}
            >
              <span className="label">02 · Simulateur live</span>
            </button>
          ) : (
            <span
              title="Vous devez d'abord simuler le prochain match"
              className="label -mb-px cursor-not-allowed border border-b-0 border-dashed border-ink px-4 py-2 text-ink/40"
            >
              02 · Simulateur verrouillé
            </span>
          )}
        </div>

        <p className="label pb-2 text-ink/60">
          <span className="text-ink">
            {homeShort} – {awayShort}
          </span>{" "}
          · Saison 2026/27
        </p>
      </div>

      {activeTab === "presentation" ? (
        <div className="space-y-16 animate-fade-in">
          {/* 1. Hero Banner principal de présentation */}
          <MatchHeroBanner
            data={data}
            onLaunchSimulation={() => {
              if (data.isNextMatch) {
                setActiveTab("simulation");
              }
            }}
          />

          {/* 2. Forme des deux équipes (filtrée par compétition) */}
          <TeamFormSection
            homeForm={data.homeForm}
            awayForm={data.awayForm}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
            competition={data.competition}
          />

          {/* 3. Classement officiel des deux équipes */}
          <StandingsComparisonSection
            homeStanding={data.homeStanding}
            awayStanding={data.awayStanding}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
            competition={data.competition}
          />

          {/* 4. Article de présentation / Scraping presse & Analyse (avec réécriture IA si admin) */}
          <MatchEditorialSection
            editorial={editorial}
            matchId={data.match.id}
            isAdmin={isAdmin}
            onEditorialUpdated={(upd) => setEditorial(upd)}
          />

          {/* 5. Le Duel des Entraîneurs / Coachs */}
          <CoachesFaceOffSection
            homeCoach={data.homeCoach}
            awayCoach={data.awayCoach}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
          />

          {/* 6. Compositions probables & Bancs (avec édition tactique si admin) */}
          <ProbableLineupsSection
            lineups={lineups}
            homeTeamName={data.match.home_team_name}
            awayTeamName={data.match.away_team_name}
            matchId={data.match.id}
            isAdmin={isAdmin}
            onLineupsChange={(upd) => setLineups(upd)}
          />

          {/* CTA Bas de page pour basculer sur la simulation */}
          {data.isNextMatch ? (
            <section className="ink-block relative left-1/2 w-screen -translate-x-1/2 py-14 md:py-20">
              <div className="mx-auto grid max-w-[1400px] gap-8 px-4 md:grid-cols-12 md:px-8 lg:px-12">
                <div className="md:col-span-8">
                  <p className="label text-paper/60">Prêt pour le coup d&apos;envoi</p>
                  <h3 className="display mt-3 text-[clamp(3.5rem,8vw,7.5rem)]">
                    Que le match <span className="text-accent-inverse">commence.</span>
                  </h3>
                </div>
                <div className="flex flex-col justify-end gap-6 md:col-span-4">
                  <p className="editorial text-xl leading-snug text-paper/75">
                    Moteur prédictif minute par minute, xG en direct et suivi des performances joueurs.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("simulation");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="label inline-flex w-fit items-center gap-3 border border-paper bg-accent px-6 py-4 text-sm text-on-accent transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0_0_var(--paper)] active:translate-x-0 active:translate-y-0 active:shadow-none"
                  >
                    Accéder au simulateur <span className="arrow">→</span>
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="border-y-[6px] border-ink py-10">
              <p className="label text-ink/60">Simulation verrouillée</p>
              <p className="display mt-3 text-5xl text-ink/40 md:text-7xl">Pas encore.</p>
              <p className="editorial mt-3 max-w-xl text-xl text-ink/70">
                Cette rencontre n&apos;est pas encore disponible : seul le prochain match officiel du calendrier peut être simulé.
              </p>
              {data.nextMatchId && (
                <Link
                  href={`/simulation/${data.nextMatchId}`}
                  className="stamp label mt-6 inline-flex items-center gap-3 border border-ink bg-accent px-5 py-3 text-on-accent"
                >
                  Simuler le match en cours <span className="arrow">→</span>
                </Link>
              )}
            </section>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Bouton retour vers la présentation */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab("presentation")}
              className="label inline-flex items-center gap-2 border-b-2 border-ink pb-0.5 hover:border-accent"
            >
              ← Retour à la présentation du match
            </button>
          </div>

          {/* Interface de simulation en direct (avec les compositions personnalisées) */}
          <MatchLiveInterface matchData={data.match} initialLineups={lineups} />
        </div>
      )}
    </div>
  );
}
