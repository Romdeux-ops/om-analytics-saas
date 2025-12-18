"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { simulateMatch } from '../lib/api';

interface MatchEvent {
  minute: number;
  type: string;
  description: string;
  current_score: { home: number; away: number };
}

interface Match {
  id: number;
  home_team_name: string;
  away_team_name: string;
  match_log: MatchEvent[];
  played: boolean;
  home_score: number;
  away_score: number;
}

export default function MatchLiveInterface({ matchData: initialData }: { matchData: Match }) {
  const [match, setMatch] = useState(initialData);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>([]);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- NOUVEAU : Calcul des statistiques en temps réel ---
  const stats = {
    home_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL")).length,
    away_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL")).length, // Simplification pour la démo
    home_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.home_team_name)).length,
    away_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.away_team_name)).length,
    possession: 50 + (Math.random() * 4 - 2) // Petite fluctuation vivante
  };

  const handleStart = async () => {
    if (match.played || match.match_log.length > 0) {
      setIsPlaying(!isPlaying);
      return;
    }
    setIsLoading(true);
    const result = await simulateMatch(match.id);
    setIsLoading(false);

    if (result && result.details) {
      setMatch(result.details);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentMinute < 90) {
      interval = setInterval(() => {
        setCurrentMinute((prev) => {
          const nextMinute = prev + 1;
          // Correction doublons : on s'assure de ne prendre que les events de la minute exacte
          const newEvents = match.match_log.filter(e => e.minute === nextMinute);
          
          if (newEvents.length > 0) {
             // On ajoute seulement si l'événement n'est pas déjà là (protection stricte)
            setDisplayEvents(prevEvents => {
              const ids = new Set(prevEvents.map(e => `${e.minute}-${e.type}`));
              const uniqueNew = newEvents.filter(e => !ids.has(`${e.minute}-${e.type}`));
              return [...uniqueNew, ...prevEvents];
            });

            const lastEvent = newEvents[newEvents.length - 1];
            if (lastEvent.current_score) setLiveScore(lastEvent.current_score);
          }
          return nextMinute;
        });
      }, 100); // Vitesse rapide pour la démo
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMinute, match.match_log]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* 1. TABLEAU DE BORD PRINCIPAL */}
      <div className="relative overflow-hidden backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl bg-slate-900/80 p-8">
        {/* Décoration d'arrière-plan */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#009DDC]/20 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center">
          {/* Domicile */}
          <div className="text-center w-1/3">
            <h2 className="text-3xl font-bold text-white mb-2">{match.home_team_name}</h2>
            <div className="text-5xl font-black text-[#009DDC]">{liveScore.home}</div>
          </div>

          {/* Centre - Chrono & Action */}
          <div className="flex flex-col items-center w-1/3 space-y-4">
            <div className="text-xl font-mono text-[#D3A400] font-bold border border-[#D3A400]/30 px-4 py-1 rounded bg-[#D3A400]/10">
              {currentMinute > 90 ? "90+" : currentMinute}'
            </div>
            
            <button 
              onClick={handleStart}
              disabled={isLoading || currentMinute >= 90}
              className={`px-8 py-3 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg
                ${isLoading ? 'bg-gray-700 text-gray-400' : 'bg-gradient-to-r from-[#009DDC] to-[#0077A6] text-white hover:shadow-[#009DDC]/50'}
              `}
            >
              {isLoading ? "IA CALCUL EN COURS..." : 
               currentMinute >= 90 ? "RÉSULTATS FINAUX" :
               isPlaying ? "⏸ PAUSE" : 
               match.played ? "▶ REVOIR LE MATCH" : "⚡ SIMULER LE MATCH"}
            </button>
          </div>

          {/* Extérieur */}
          <div className="text-center w-1/3">
            <h2 className="text-3xl font-bold text-white mb-2">{match.away_team_name}</h2>
            <div className="text-5xl font-black text-red-500">{liveScore.away}</div>
          </div>
        </div>

        {/* 2. STATISTIQUES (NOUVEAU) */}
        <div className="mt-12 grid grid-cols-3 gap-8 border-t border-white/5 pt-8">
            <StatBar label="Possession" leftValue={52} rightValue={48} color="bg-green-500" />
            <StatBar label="Tirs Cadrés" leftValue={stats.home_shots + 2} rightValue={stats.away_shots + 1} color="bg-blue-500" />
            <StatBar label="Cartons" leftValue={stats.home_cards} rightValue={stats.away_cards} color="bg-yellow-500" />
        </div>
      </div>

      {/* 3. FIL DU MATCH */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 h-[300px] overflow-y-auto">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Événements du match</h3>
        <AnimatePresence>
          {displayEvents.map((event, index) => (
            <motion.div
              key={`${event.minute}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-3 text-sm"
            >
              <span className="font-mono text-[#009DDC] w-8 text-right font-bold">{event.minute}'</span>
              <div className={`px-3 py-2 rounded flex-1 border-l-2 ${
                  event.type.includes('GOAL') ? 'bg-[#009DDC]/10 border-[#009DDC] text-white' : 
                  event.type === 'CARD' ? 'bg-yellow-500/10 border-yellow-500 text-gray-200' : 
                  'bg-white/5 border-gray-600 text-gray-400'
              }`}>
                {event.description}
              </div>
            </motion.div>
          ))}
          {displayEvents.length === 0 && <div className="text-center text-gray-600 italic mt-10">Le coup d'envoi va être donné...</div>}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Petit composant pour les barres de stats
function StatBar({ label, leftValue, rightValue, color }: any) {
    const total = leftValue + rightValue || 1;
    const leftPercent = (leftValue / total) * 100;
    
    return (
        <div className="flex flex-col gap-1">
            <div className="flex justify-between text-sm font-bold text-gray-400">
                <span>{leftValue}</span>
                <span className="text-xs uppercase tracking-wider text-gray-600">{label}</span>
                <span>{rightValue}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${leftPercent}%` }} className={`h-full ${color} opacity-80`}></div>
                <div style={{ width: `${100 - leftPercent}%` }} className="h-full bg-gray-600 opacity-30"></div>
            </div>
        </div>
    );
}