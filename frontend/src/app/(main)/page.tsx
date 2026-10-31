import { Suspense } from "react";
import { formatSeason } from "@om/db/season";
import { NextMatchCard } from "@/src/components/home/NextMatchCard";
import { StandingsCard } from "@/src/components/home/StandingsCard";
import { SimulationPanel } from "@/src/components/home/SimulationPanel";
import { NewsFeed } from "@/src/components/home/NewsFeed";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export default function Home() {
  return (
    <>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-0">
        <div className="lg:col-span-8 lg:pr-10">
          <Suspense fallback={<CardSkeleton rows={4} className="min-h-[420px]" />}>
            <NextMatchCard />
          </Suspense>
        </div>
        <div className="lg:col-span-4 lg:border-l lg:border-ink lg:pl-8">
          <Suspense fallback={<CardSkeleton rows={5} className="min-h-[420px]" />}>
            <StandingsCard />
          </Suspense>
        </div>
      </div>

      <div className="mt-16 md:mt-20">
        <Suspense fallback={<div className="ink-block relative left-1/2 h-96 w-screen -translate-x-1/2" />}>
          <SimulationPanel />
        </Suspense>
      </div>

      <div className="mt-16 md:mt-20">
        <Suspense fallback={<CardSkeleton rows={4} />}>
          <NewsFeed />
        </Suspense>
      </div>

      <footer className="mt-20 border-t-[6px] border-ink pt-4">
        <p className="display text-[clamp(3rem,12vw,11rem)] text-ink">Droit au but.</p>
        <div className="mt-4 flex flex-col justify-between gap-2 border-t border-ink pt-3 sm:flex-row">
          <p className="label text-ink/60">OM Analytics — simulation sportive par IA</p>
          <p className="label text-ink/60">Saison {formatSeason()} · Données live</p>
        </div>
      </footer>
    </>
  );
}
