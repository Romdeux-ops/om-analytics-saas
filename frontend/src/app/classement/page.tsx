import Link from "next/link";
import { ArrowLeft, ListOrdered } from "lucide-react";
import { ClassementView } from "@/src/components/classement/ClassementView";
import { StandingsTable } from "@/src/components/classement/StandingsTable";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import { Reveal } from "@/src/components/ui/Reveal";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import {
  COMPETITIONS,
  getCompetition,
  getLigue1Standings,
} from "@/src/lib/data/competitions";

export default function ClassementPage() {
  const ligue1 = getCompetition("ligue1");
  const panels = {
    ligue1: <StandingsTable standings={getLigue1Standings()} season={ligue1.season} />,
    europa: <DrawPlaceholder competition={getCompetition("europa")} />,
    coupe: <DrawPlaceholder competition={getCompetition("coupe")} />,
  };

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
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
                  <ListOrdered size={18} />
                </span>
                <div>
                  <h1 className="font-tech text-2xl font-black tracking-tight text-white md:text-3xl">
                    <span className="text-gradient-gold">Classements</span>
                  </h1>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                    Ligue 1 · Europa League · Coupe de France
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
        </header>

        <Reveal>
          <ClassementView competitions={COMPETITIONS} panels={panels} />
        </Reveal>
      </main>
    </div>
  );
}
