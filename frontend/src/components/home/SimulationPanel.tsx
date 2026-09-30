import Link from "next/link";
import { Play, Zap, Users, Sparkles, Swords, Calendar } from "lucide-react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { getUpcomingMatches } from "@/src/lib/data/matches";
import { fullTeamName, isOmTeam, shortTeamName } from "@/src/lib/ui/teams";
import type { MatchView } from "@/src/lib/types/match";

const PARIS_TZ = "Europe/Paris";

function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TZ,
  }).format(date);
}

/**
 * Bandeau Hero pour le prochain match à simuler :
 * Affiche l'affiche complète avec écussons, dates, badges et bouton d'action direct.
 */
function FeaturedMatchBanner({ match }: { match: MatchView }) {
  const isOmHome = isOmTeam(match.home_team_name);
  const homeShort = shortTeamName(match.home_team_name);
  const awayShort = shortTeamName(match.away_team_name);
  const homeFull = fullTeamName(match.home_team_name);
  const awayFull = fullTeamName(match.away_team_name);
  const matchDate = new Date(match.date);

  return (
    <Link
      href={`/simulation/${match.id}`}
      prefetch
      className="pressable group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan-400/30 bg-gradient-to-br from-cyan-950/40 via-white/[0.03] to-blue-950/30 p-5 shadow-lg shadow-cyan-950/20 backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-400/60 hover:shadow-cyan-500/10 md:p-6"
    >
      {/* Halo lumineux d'ambiance */}
      <span className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-cyan-500/15 blur-3xl transition-opacity group-hover:opacity-100" />
      <span className="pointer-events-none absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-blue-600/15 blur-3xl transition-opacity group-hover:opacity-100" />

      {/* Barre supérieure : Badges */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-200 shadow-sm shadow-cyan-500/10">
            <span className="pulse-dot bg-cyan-400" />
            Prochain match à simuler
          </span>
          <Badge variant={isOmHome ? "om" : "muted"} className="hidden sm:inline-flex">
            {isOmHome ? "À domicile" : "À l'extérieur"}
          </Badge>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          <Calendar size={13} className="text-cyan-400" />
          <span className="capitalize">{formatFullDate(matchDate)}</span>
        </span>
      </div>

      {/* Affiche centrale : Équipes & VS */}
      <div className="relative z-10 my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        {/* Équipe Domicile */}
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-3.5 sm:text-left">
          <TeamCrest
            name={match.home_team_name}
            size="lg"
            className="ring-2 ring-white/10 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="min-w-0">
            <p className="truncate font-tech text-base font-black uppercase text-white sm:text-lg">
              {homeShort}
            </p>
            <p className="hidden truncate text-xs text-slate-400 sm:block">
              {homeFull}
            </p>
          </div>
        </div>

        {/* VS Central */}
        <div className="flex flex-col items-center gap-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cyan-300 shadow-inner group-hover:border-cyan-400/40">
            <Swords size={16} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">
            VS
          </span>
        </div>

        {/* Équipe Extérieur */}
        <div className="flex flex-col items-center gap-2 text-center sm:flex-row-reverse sm:items-center sm:gap-3.5 sm:text-right">
          <TeamCrest
            name={match.away_team_name}
            size="lg"
            className="ring-2 ring-white/10 transition-transform duration-300 group-hover:scale-105"
          />
          <div className="min-w-0">
            <p className="truncate font-tech text-base font-black uppercase text-white sm:text-lg">
              {awayShort}
            </p>
            <p className="hidden truncate text-xs text-slate-400 sm:block">
              {awayFull}
            </p>
          </div>
        </div>
      </div>

      {/* Pied du bandeau : Compositions probables + Gros CTA */}
      <div className="relative z-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-300">
            <Users size={13} />
          </span>
          <span>11 Probables &amp; remplaçants ESPN intégrés</span>
        </div>

        <span className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-500 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-950 shadow-lg shadow-cyan-500/25 transition-transform duration-200 group-hover:scale-[1.02] sm:w-auto">
          <Play size={14} className="fill-current" />
          Lancer la simulation
        </span>
      </div>
    </Link>
  );
}

function MatchRow({ match }: { match: MatchView }) {
  return (
    <Link
      href={`/simulation/${match.id}`}
      prefetch
      className="pressable group/row relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-white/[0.04]"
    >
      <span className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-gradient-to-b from-cyan-400/0 via-cyan-400/60 to-cyan-400/0 opacity-0 transition-opacity group-hover/row:opacity-100" />

      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex items-center -space-x-2">
          <TeamCrest name={match.home_team_name} size="sm" className="ring-2 ring-[var(--bg-raise)]" />
          <TeamCrest name={match.away_team_name} size="sm" className="ring-2 ring-[var(--bg-raise)]" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-tech text-base font-bold text-white">
            {shortTeamName(match.home_team_name)}{" "}
            <span className="font-normal text-slate-500">vs</span>{" "}
            {shortTeamName(match.away_team_name)}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="muted">À simuler</Badge>
            <span className="text-[10px] uppercase tracking-wider text-slate-500">
              {formatShortDate(new Date(match.date))}
            </span>
          </div>
        </div>
      </div>

      <span className="pointer-events-none inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-cyan-300 transition-colors group-hover/row:border-cyan-400/40 group-hover/row:bg-cyan-500/20 group-hover/row:text-white">
        <Play size={12} className="fill-current" />
        Simuler
      </span>
    </Link>
  );
}

export async function SimulationPanel() {
  const matches = await getUpcomingMatches(6);
  const featured = matches[0];
  const others = matches.slice(1);

  return (
    <Card className="flex h-full flex-col gap-5">
      <SectionHeading
        title="Simulation IA"
        subtitle="Moteur de match prédictif &amp; compositions probables"
        icon={<Zap size={16} />}
        action={
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-emerald-300">
            <span className="pulse-dot" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Moteur actif</span>
          </span>
        }
      />

      {matches.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
            <Zap size={22} className="text-cyan-400" />
          </div>
          <p className="mb-1 text-slate-300">Tous les matchs ont été simulés.</p>
          <p className="text-sm text-slate-500">
            Lancez{" "}
            <code className="rounded bg-white/10 px-2 py-0.5 text-xs text-cyan-200">
              bunx supabase db reset
            </code>{" "}
            pour réinitialiser.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bandeau dynamique pour le prochain match */}
          {featured && <FeaturedMatchBanner match={featured} />}

          {/* Autres rencontres de la liste */}
          {others.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold uppercase tracking-wider text-[11px] text-slate-400">
                  Autres rencontres à simuler
                </span>
                <span className="text-[11px] text-slate-500">
                  {others.length} match{others.length > 1 ? "s" : ""} disponible{others.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {others.map((match) => (
                  <MatchRow key={match.id} match={match} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
