import { HomeHeader } from "@/src/components/home/HomeHeader";
import { NextMatchCard } from "@/src/components/home/NextMatchCard";
import { StandingsCard } from "@/src/components/home/StandingsCard";
import { SimulationPanel } from "@/src/components/home/SimulationPanel";
import { NewsFeed } from "@/src/components/home/NewsFeed";
import { Reveal } from "@/src/components/ui/Reveal";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <div className="page-shell">
      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-10 lg:px-8">
        <HomeHeader />

        <div className="grid grid-cols-1 gap-5 md:gap-6 lg:grid-cols-12">
          <Reveal className="h-full lg:col-span-7">
            <NextMatchCard />
          </Reveal>
          <Reveal delay={0.08} className="h-full lg:col-span-5">
            <StandingsCard />
          </Reveal>
          <Reveal delay={0.12} className="lg:col-span-12">
            <SimulationPanel />
          </Reveal>
          <Reveal delay={0.16} className="lg:col-span-12">
            <NewsFeed />
          </Reveal>
        </div>

        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-slate-600 sm:flex-row">
          <p>
            <span className="font-tech font-bold text-slate-400">OM ANALYTICS</span> — simulation
            sportive par IA
          </p>
          <p className="uppercase tracking-widest">Saison 2025/26 · Données mock &amp; live</p>
        </footer>
      </main>
    </div>
  );
}
