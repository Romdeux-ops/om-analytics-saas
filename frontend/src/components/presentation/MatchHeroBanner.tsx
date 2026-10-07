"use client";

import { memo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Play,
  Swords,
  ChevronDown,
  Trophy,
} from "lucide-react";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { Badge } from "@/src/components/ui/Badge";
import { shortTeamName, fullTeamName } from "@/src/lib/ui/teams";
import type { MatchPresentationData } from "@/src/lib/data/match-presentation";

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

export const MatchHeroBanner = memo(function MatchHeroBanner({
  data,
  onLaunchSimulation,
}: MatchHeroBannerProps) {
  const { match, stadium, homeStanding, awayStanding, homeForm, awayForm, upcomingMatches } = data;
  const matchDate = new Date(match.date);
  const homeShort = shortTeamName(match.home_team_name);
  const awayShort = shortTeamName(match.away_team_name);
  const homeFull = fullTeamName(match.home_team_name);
  const awayFull = fullTeamName(match.away_team_name);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 via-slate-950/90 to-black p-6 shadow-2xl backdrop-blur-2xl md:p-8">
      {/* Halos lumineux d'ambiance */}
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-cyan-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-blue-600/15 blur-[100px]" />

      {/* Barre supérieure : Compétition, Stade & Sélecteur de match */}
      <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="gold">
            <Trophy size={11} />
            Ligue 1 · 2026-2027
          </Badge>
          <Badge variant="muted">
            <MapPin size={11} className="text-cyan-400" />
            {stadium.name} · {stadium.city}
          </Badge>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Calendar size={13} className="text-cyan-400" />
            <span className="capitalize">{formatMatchDate(matchDate)}</span>
          </span>
        </div>

        {/* Sélecteur de match rapide s'il y a d'autres matchs */}
        {upcomingMatches.length > 1 && (
          <div className="relative group">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-cyan-400/40 hover:bg-white/10 hover:text-white"
            >
              <span>Changer de match</span>
              <ChevronDown size={13} className="text-slate-400 transition-transform group-hover:rotate-180" />
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-1 w-64 translate-y-1 rounded-2xl border border-white/10 bg-slate-900/95 p-1.5 opacity-0 shadow-2xl backdrop-blur-2xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
              <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Matchs à venir
              </p>
              <div className="max-h-60 space-y-1 overflow-y-auto no-scrollbar">
                {upcomingMatches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/simulation/${m.id}`}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                      m.id === match.id
                        ? "bg-cyan-500/20 text-cyan-300 font-bold"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">
                      {shortTeamName(m.home_team_name)} vs {shortTeamName(m.away_team_name)}
                    </span>
                    <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                      {new Date(m.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Face-à-face central des deux équipes */}
      <div className="relative z-10 grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        {/* Équipe Domicile */}
        <div className="flex flex-col items-center text-center md:items-end md:text-right">
          <div className="flex flex-col items-center gap-4 md:flex-row-reverse">
            <TeamCrest
              name={match.home_team_name}
              size="lg"
              className="h-20 w-20 ring-4 ring-white/10 transition-transform duration-300 hover:scale-110 md:h-24 md:w-24"
            />
            <div>
              <span className="inline-block rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                Domicile
              </span>
              <h2 className="mt-1 font-tech text-2xl font-black uppercase tracking-tight text-white md:text-3xl lg:text-4xl">
                {homeShort}
              </h2>
              <p className="text-xs text-slate-400">{homeFull}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-end">
                {homeStanding && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-200">
                    {homeStanding.rank}e · {homeStanding.points} pts
                  </span>
                )}
                {/* 5 derniers matchs - pastilles */}
                <div className="flex items-center gap-1" title="Forme (5 derniers matchs Ligue 1)">
                  {homeForm.formSequence.map((res, i) => (
                    <span
                      key={i}
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                        res === "V"
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                          : res === "N"
                            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                            : "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Centre : VS & Bouton Lancer la simulation */}
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-cyan-300 shadow-inner">
            <Swords size={22} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">
            AVANT-MATCH
          </span>
          <button
            type="button"
            onClick={onLaunchSimulation}
            className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:scale-105 hover:shadow-cyan-400/40"
          >
            <Play size={13} className="fill-current transition-transform group-hover:scale-110" />
            <span>Lancer la simulation</span>
          </button>
        </div>

        {/* Équipe Extérieur */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <div className="flex flex-col items-center gap-4 md:flex-row">
            <TeamCrest
              name={match.away_team_name}
              size="lg"
              className="h-20 w-20 ring-4 ring-white/10 transition-transform duration-300 hover:scale-110 md:h-24 md:w-24"
            />
            <div>
              <span className="inline-block rounded bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Extérieur
              </span>
              <h2 className="mt-1 font-tech text-2xl font-black uppercase tracking-tight text-white md:text-3xl lg:text-4xl">
                {awayShort}
              </h2>
              <p className="text-xs text-slate-400">{awayFull}</p>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                {awayStanding && (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[11px] font-bold text-slate-200">
                    {awayStanding.rank}e · {awayStanding.points} pts
                  </span>
                )}
                {/* 5 derniers matchs - pastilles */}
                <div className="flex items-center gap-1" title="Forme (5 derniers matchs Ligue 1)">
                  {awayForm.formSequence.map((res, i) => (
                    <span
                      key={i}
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black ${
                        res === "V"
                          ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                          : res === "N"
                            ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40"
                            : "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                      }`}
                    >
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
