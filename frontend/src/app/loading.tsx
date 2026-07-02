export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-medium">Chargement du match...</p>
        <p className="text-slate-400 text-sm mt-2">Connexion à Supabase...</p>
      </div>
    </div>
  );
}
