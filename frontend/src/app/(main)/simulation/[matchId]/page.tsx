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
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="relative z-10 max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-2xl">
        <h2 className="mb-2 font-tech text-2xl font-bold text-white">Match introuvable</h2>
        <p className="mb-6 text-slate-400">{message}</p>
        <Button href="/" variant="outline">
          Retour au menu
        </Button>
      </div>
    </div>
  );
}
