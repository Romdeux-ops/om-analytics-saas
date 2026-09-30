import nextDynamic from "next/dynamic";
import { getFirstUnplayedMatch, getNextOmMatch } from "@om/db";
import { getDb } from "@/src/lib/db";
import { Button } from "@/src/components/ui/Button";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";

export const dynamic = "force-dynamic";

const MatchLiveInterface = nextDynamic(
  () => import("@/src/components/match/MatchLiveInterface"),
  { loading: () => <CardSkeleton rows={6} className="min-h-[50vh]" /> },
);

export default async function SimulationIndexPage() {
  const db = getDb();
  // Chercher en priorité le prochain match de l'OM non joué
  const match = (await getNextOmMatch(db)) ?? (await getFirstUnplayedMatch(db));

  if (!match) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
          <h2 className="mb-2 font-tech text-2xl font-bold text-white">
            Aucun match à simuler
          </h2>
          <p className="mb-6 text-slate-400">
            Tous les matchs de la saison ont été simulés ou le calendrier est terminé.
          </p>
          <Button href="/" variant="outline">
            Retour au menu
          </Button>
        </div>
      </div>
    );
  }

  return <MatchLiveInterface matchData={match} />;
}
