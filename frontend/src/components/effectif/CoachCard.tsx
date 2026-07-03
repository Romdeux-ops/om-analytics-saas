import { UserRound } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { Badge } from "@/src/components/ui/Badge";
import { formatSquadTotalValue } from "@/src/lib/ui/market-value";

interface CoachCardProps {
  coachName: string | null;
  totalMarketValue: number;
  playerCount: number;
  season?: string;
}

export function CoachCard({
  coachName,
  totalMarketValue,
  playerCount,
  season = "2026-2027",
}: CoachCardProps) {
  return (
    <Card variant="hero" className="mb-8">
      <SectionHeading
        title="Staff technique"
        subtitle={`Saison ${season}`}
        icon={<UserRound size={16} />}
        action={
          <Badge variant="gold">
            {playerCount} joueurs
          </Badge>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Entraîneur
          </p>
          <p className="mt-2 font-tech text-2xl font-black text-white md:text-3xl">
            {coachName ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-400/15 bg-cyan-500/5 p-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Valorisation totale
          </p>
          <p className="mt-2 font-tech text-2xl font-black text-cyan-200 md:text-3xl tabular-nums">
            {formatSquadTotalValue(totalMarketValue)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Somme des valeurs marchandes connues
          </p>
        </div>
      </div>
    </Card>
  );
}
