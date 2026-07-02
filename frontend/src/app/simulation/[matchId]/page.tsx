import MatchLiveInterface from "@/src/components/match/MatchLiveInterface";
import { Button } from "@/src/components/ui/Button";
import { getMatchById } from "@om/db";
import { getDb } from "@/src/lib/db";

export const dynamic = "force-dynamic";

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

  return <MatchLiveInterface matchData={match} />;
}

function SimulationError({ message }: { message: string }) {
  return (
    <div className="page-shell flex items-center justify-center min-h-screen">
      <div className="relative z-10 text-center backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md">
        <h2 className="text-2xl font-bold text-white mb-2 font-tech">Match introuvable</h2>
        <p className="text-slate-400 mb-6">{message}</p>
        <Button href="/" variant="outline">
          Retour au menu
        </Button>
      </div>
    </div>
  );
}
