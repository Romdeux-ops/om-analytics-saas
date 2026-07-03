import Link from "next/link";
import { ArrowLeft, CalendarDays } from "lucide-react";
import {
  CalendarView,
  type CalendarTabId,
} from "@/src/components/calendrier/CalendarView";
import { FixtureList } from "@/src/components/calendrier/FixtureList";
import { NextMatchHighlight } from "@/src/components/calendrier/NextMatchHighlight";
import { DrawPlaceholder } from "@/src/components/classement/DrawPlaceholder";
import type { TabDescriptor } from "@/src/components/classement/CompetitionTabs";
import { Reveal } from "@/src/components/ui/Reveal";
import { ThemeToggle } from "@/src/components/ui/ThemeToggle";
import { COMPETITIONS, getCompetition } from "@/src/lib/data/competitions";
import { getAllOmFixtures, getOmFixtures } from "@/src/lib/data/calendar";

const SEASON = "2026-2027";

export default function CalendrierPage() {
  const tabs: TabDescriptor<CalendarTabId>[] = [
    { id: "general", label: "Calendrier général", shortLabel: "Tous", season: SEASON },
    ...COMPETITIONS.map((c) => ({
      id: c.id,
      label: c.label,
      shortLabel: c.shortLabel,
      season: c.season,
    })),
  ];

  const panels: Record<CalendarTabId, React.ReactNode> = {
    general: (
      <FixtureList
        fixtures={getAllOmFixtures()}
        title="Calendrier général"
        season={SEASON}
        showCompetition
        note="Toutes compétitions confondues. L'Europa League et la Coupe de France seront ajoutées ici dès les tirages effectués."
      />
    ),
    ligue1: <FixtureList fixtures={getOmFixtures("ligue1")} title="Ligue 1" season={SEASON} />,
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
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/10 text-cyan-300">
                  <CalendarDays size={18} />
                </span>
                <div>
                  <h1 className="font-tech text-2xl font-black tracking-tight text-white md:text-3xl">
                    <span className="text-gradient">Calendrier</span>
                  </h1>
                  <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                    Ligue 1 · Europa League · Coupe de France
                  </p>
                </div>
              </div>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
        </header>

        <Reveal>
          <NextMatchHighlight />
          <CalendarView tabs={tabs} panels={panels} />
        </Reveal>
      </main>
    </div>
  );
}
