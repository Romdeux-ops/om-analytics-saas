import { Play, Zap } from "lucide-react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Card } from "@/src/components/ui/Card";
import { TeamCrest } from "@/src/components/ui/TeamCrest";
import { getUpcomingMatches } from "@/src/lib/data/matches";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { MatchView } from "@/src/lib/types/match";

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function MatchRow({ match }: { match: MatchView }) {
  return (
    <div className="group/row relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:border-cyan-400/25 hover:bg-white/[0.04]">
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

      <Button
        href={`/simulation/${match.id}`}
        variant="primary"
        size="sm"
        className="shrink-0 transition-transform group-hover/row:scale-105"
      >
        <Play size={14} />
        Simuler
      </Button>
    </div>
  );
}

export async function SimulationPanel() {
  const matches = await getUpcomingMatches(6);

  return (
    <Card className="flex h-full flex-col">
      <SectionHeading
        title="Simulation IA"
        subtitle="Prédisez les prochains résultats"
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
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {matches.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </Card>
  );
}
