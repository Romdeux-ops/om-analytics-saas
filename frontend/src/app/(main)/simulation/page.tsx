import type { Metadata } from "next";
import nextDynamic from "next/dynamic";
import { getFirstUnplayedMatch, getNextOmMatch } from "@om/db";
import { getDb } from "@/src/lib/db";
import { Button } from "@/src/components/ui/Button";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { getMatchPresentationData } from "@/src/lib/data/match-presentation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prochain match",
  description: "Avant-match de l'OM : forme, classement, compositions probables et simulation.",
  alternates: { canonical: "/simulation" },
};

const MatchPresentationView = nextDynamic(
  () => import("@/src/components/presentation/MatchPresentationView").then((mod) => mod.MatchPresentationView),
  { loading: () => <CardSkeleton rows={8} className="min-h-[70vh]" /> },
);

export default async function SimulationIndexPage() {
  const db = getDb();
  // Chercher en priorité le prochain match de l'OM non joué
  const match = (await getNextOmMatch(db)) ?? (await getFirstUnplayedMatch(db));

  if (!match) {
    return (
      <section className="min-h-[50vh] border-t-[6px] border-ink pt-3">
        <p className="label text-ink/60">Simulation</p>
        <h2 className="display mt-3 text-6xl text-ink md:text-8xl">Aucun match à simuler</h2>
        <p className="editorial mb-8 mt-4 max-w-xl text-xl text-ink/70">
          Tous les matchs de la saison ont été simulés ou le calendrier est terminé.
        </p>
        <Button href="/" variant="ghost">
          ← Retour à la Une
        </Button>
      </section>
    );
  }

  const presentationData = await getMatchPresentationData(match);

  return <MatchPresentationView data={presentationData} />;
}
