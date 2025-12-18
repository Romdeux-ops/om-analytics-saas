"use client";
import { useEffect, useState } from 'react';
import MatchLiveInterface from '../components/MatchLiveInterface';

export default function Home() {
  const [matchData, setMatchData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchMatch() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/matches/1/', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setMatchData(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Error fetching match:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMatch();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Chargement du match...</p>
          <p className="text-slate-400 text-sm mt-2">Connexion au backend Django...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-8 max-w-md">
          <div className="text-red-400 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-white mb-2">Erreur de connexion</h2>
          <p className="text-slate-400 mb-4">
            Impossible de se connecter au backend Django.
          </p>
          <p className="text-sm text-slate-500">
            Vérifiez que le serveur tourne sur <code className="bg-white/10 px-2 py-1 rounded">http://127.0.0.1:8000</code>
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

 return <MatchLiveInterface matchData={matchData ?? undefined} />;
}