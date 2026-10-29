import nextDynamic from "next/dynamic";
import { Button } from "@/src/components/ui/Button";
import { CardSkeleton } from "@/src/components/ui/CardSkeleton";
import { getMatchById } from "@om/db";
import { getDb } from "@/src/lib/db";
import { getMatchPresentationData } from "@/src/lib/data/match-presentation";

export const dynamic = "force-dynamic";

const MatchPresentationView = nextDynamic(
  () => import("@/src/components/presentation/MatchPresentationView").then((mod) => mod.MatchPresentationView),
  { loading: () => <CardSkeleton rows={8} className="min-h-[70vh]" /> },
);

interface SimulationPageProps {
  params: Promise<{ matchId: string }>;
}

export default async function SimulationPage({ params }: SimulationPageProps) {
  const { matchId } = await params;
  const id = Number(matchId);

  if (Number.isNaN(id)) {
    return <SimulationError message="Identifiant de match invalide." />;
  }

  const match = await getMatchById(getDb(), id);

  if (!match) {
    return <SimulationError message="Ce match n'existe pas ou a été supprimé." />;
  }

  const presentationData = await getMatchPresentationData(match);

  return <MatchPresentationView data={presentationData} />;
}

function SimulationError({ message }: { message: string }) {
  return (
    <section className="min-h-[50vh] border-t-[6px] border-ink pt-3">
      <p className="label text-live-text">Hors-jeu</p>
      <h2 className="display mt-3 text-6xl text-ink md:text-8xl">Match introuvable</h2>
      <p className="editorial mb-8 mt-4 max-w-xl text-xl text-ink/70">{message}</p>
      <Button href="/" variant="ghost">
        ← Retour à la Une
      </Button>
    </section>
  );
}
