import { Suspense } from "react";
import { NextMatchCard } from "@/src/components/home/NextMatchCard";
import { StandingsCard } from "@/src/components/home/StandingsCard";
import { SimulationPanel } from "@/src/components/home/SimulationPanel";
import { NewsFeed } from "@/src/components/home/NewsFeed";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function Home() {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
        <div className="h-full lg:col-span-7">
          <Suspense fallback={<CardSkeleton rows={4} className="min-h-[280px]" />}>
            <NextMatchCard />
          </Suspense>
        </div>
        <div className="h-full lg:col-span-5">
          <Suspense fallback={<CardSkeleton rows={5} className="min-h-[280px]" />}>
            <StandingsCard />
          </Suspense>
        </div>
        <div className="lg:col-span-12">
          <Suspense fallback={<CardSkeleton rows={3} />}>
            <SimulationPanel />
          </Suspense>
        </div>
        <div className="lg:col-span-12">
          <Suspense fallback={<CardSkeleton rows={4} />}>
            <NewsFeed />
          </Suspense>
        </div>
      </div>

      <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
        <p>
          <span className="font-tech font-bold text-slate-400">OM ANALYTICS</span> — simulation
          sportive par IA
        </p>
        <p className="uppercase tracking-widest">Saison 2026/27 · Données live</p>
      </footer>
    </>
  );
}
