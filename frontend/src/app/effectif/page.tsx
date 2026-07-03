import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { CoachCard } from "@/src/components/effectif/CoachCard";
import { SquadTable } from "@/src/components/effectif/SquadTable";
import { Reveal } from "@/src/components/ui/Reveal";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { getOmCoach, getOmSquad, getOmSquadTotalValue } from "@/src/lib/data/squad";

export const dynamic = "force-dynamic";

export default async function EffectifPage() {
  const [squad, coach, totalValue] = await Promise.all([
    getOmSquad(),
    getOmCoach(),
    getOmSquadTotalValue(),
  ]);

  return (
    <div className="page-shell">
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-10 lg:px-8">
        <header className="mb-8 md:mb-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={16} />
                <span className="hidden sm:inline">Menu</span>
              </Link>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                  <Users size={18} />
                </span>
                <div>
                  <h1 className="font-tech text-2xl font-black tracking-tight text-white md:text-3xl">
                    <span className="text-gradient">Effectif</span>
                  </h1>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                    Olympique de Marseille · Saison 2026-2027
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
        </header>

        <Reveal>
          <CoachCard
            coachName={coach}
            totalMarketValue={totalValue}
            playerCount={squad.length}
          />
          <SquadTable players={squad} />
        </Reveal>
      </main>
    </div>
  );
}
