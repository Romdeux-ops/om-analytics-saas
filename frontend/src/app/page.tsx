import MatchLiveInterface from "@/src/components/MatchLiveInterface";
import { getFirstUnplayedMatch, getMatchById } from "@om/db";
import { getDb } from "@/src/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = getDb();
  const match = (await getFirstUnplayedMatch(db)) ?? (await getMatchById(db, 1));

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md">
          <div className="text-amber-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Aucun match trouvé</h2>
          <p className="text-slate-400 mb-4">
            La base Supabase ne contient pas encore de match.
          </p>
          <p className="text-sm text-slate-500">
            Lancez{" "}
            <code className="bg-white/10 px-2 py-1 rounded">bunx supabase db reset</code>{" "}
            pour réappliquer le seed.
          </p>
        </div>
      </div>
    );
  }

  return <MatchLiveInterface matchData={match} />;
}
