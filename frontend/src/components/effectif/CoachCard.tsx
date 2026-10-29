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
    <section className="mb-16 grid border-y-[6px] border-ink md:grid-cols-12">
      <div className="py-5 md:col-span-7 md:border-r md:border-ink md:pr-8">
        <p className="label text-ink/60">Staff technique · Saison {season}</p>
        <p className="editorial mt-3 text-lg text-ink/70">Sur le banc</p>
        <p className="display text-6xl text-ink md:text-8xl">{coachName ?? "—"}</p>
      </div>
      <div className="flex flex-col justify-between gap-4 border-t border-ink py-5 md:col-span-5 md:border-t-0 md:pl-8">
        <p className="label text-ink/60">Valorisation totale · {playerCount} joueurs</p>
        <p className="display text-6xl tabular text-accent-text md:text-7xl">
          {formatSquadTotalValue(totalMarketValue)}
        </p>
        <p className="label text-ink/50">Somme des valeurs marchandes connues</p>
      </div>
    </section>
  );
}
