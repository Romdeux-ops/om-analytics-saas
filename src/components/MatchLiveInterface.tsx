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
  id: number; // Important pour l'API
  home_team_name: string;
  away_team_name: string;
  match_log: MatchEvent[];
  played: boolean;
  home_score: number;
  away_score: number;
}

export default function MatchLiveInterface({ matchData: initialData }: { matchData: Match }) {
  // On stocke les données du match dans un état pour pouvoir les mettre à jour après la simulation
  const [match, setMatch] = useState(initialData);
  
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>([]);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // État de chargement

  // Fonction déclenchée par le bouton
  const handleStart = async () => {
    // Si le match a déjà été joué (en base de données) ou simulé localement, on lance juste la lecture
    if (match.played || match.match_log.length > 0) {
      setIsPlaying(!isPlaying);
      return;
    }

    // SINON : On demande à Python de calculer le match
    setIsLoading(true);
    const result = await simulateMatch(match.id);
    setIsLoading(false);

    if (result && result.details) {
      // Python a répondu ! On met à jour les données locales
      setMatch(result.details); 
      // Et on lance la lecture automatique
      setIsPlaying(true);
    } else {
      alert("Erreur lors de la simulation (Vérifiez le terminal Backend)");
    }
  };

  // Moteur de lecture (Playback)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    // Si on joue et qu'on n'est pas à 90min
    if (isPlaying && currentMinute < 90) {
      interval = setInterval(() => {
        setCurrentMinute((prev) => {
          const nextMinute = prev + 1;
          
          // On cherche les événements de cette minute dans le log reçu de Python
          const newEvents = match.match_log.filter(e => e.minute === nextMinute);
          
          if (newEvents.length > 0) {
            setDisplayEvents(prevEvents => [...newEvents, ...prevEvents]);
            // Mise à jour du score
            const lastEvent = newEvents[newEvents.length - 1];
            if (lastEvent.current_score) setLiveScore(lastEvent.current_score);
          }
          return nextMinute;
        });
      }, 150); // Vitesse de défilement (150ms = 1 minute de match)
    }

    return () => clearInterval(interval);
  }, [isPlaying, currentMinute, match.match_log]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Scoreboard */}
      <div className="p-8 flex justify-between items-center relative overflow-hidden backdrop-blur-md border border-white/10 shadow-xl rounded-2xl bg-[rgba(255,255,255,0.05)]">
        
        {/* Effets lumineux */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-full bg-[#009DDC]/10 blur-3xl rounded-full"></div>

        {/* Équipe Domicile */}
        <h2 className="text-2xl font-bold text-gray-300 z-10 w-1/3 text-right">{match.home_team_name}</h2>
        
        {/* Centre (Score & Bouton) */}
        <div className="z-10 flex flex-col items-center w-1/3">
          <div className="text-6xl font-black text-white tracking-widest font-mono">
            {liveScore.home} - {liveScore.away}
          </div>
          
          <div className="mt-2 text-[#D3A400] font-semibold">
            {currentMinute > 90 ? "90" : currentMinute}' <span className="text-xs text-gray-500">/ 90'</span>
          </div>
          
          <button 
            onClick={handleStart}
            disabled={isLoading || currentMinute >= 90}
            className={`mt-6 px-8 py-2 rounded-full font-bold transition-all shadow-lg text-sm
              ${isLoading ? 'bg-gray-600 cursor-wait' : 'bg-[#009DDC] hover:bg-blue-500 hover:scale-105 shadow-[0_0_15px_rgba(0,157,220,0.5)]'}
              text-white
            `}
          >
            {isLoading ? "CALCUL..." : 
             currentMinute >= 90 ? "MATCH TERMINÉ" :
             isPlaying ? "PAUSE" : 
             match.played ? "REVOIR LE MATCH" : "SIMULER LE MATCH"}
          </button>
        </div>

        {/* Équipe Extérieur */}
        <h2 className="text-2xl font-bold text-gray-300 z-10 w-1/3 text-left">{match.away_team_name}</h2>
      </div>

      {/* Logs du match (Live Feed) */}
      <div className="p-4 h-[400px] overflow-y-auto backdrop-blur-md border border-white/10 shadow-xl rounded-2xl bg-[rgba(255,255,255,0.05)] custom-scrollbar">
        <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider sticky top-0 bg-[#0B1120]/80 p-2 backdrop-blur-sm z-10">Fil du match</h3>
        
        <AnimatePresence>
          {displayEvents.map((event, index) => (
            <motion.div
              key={`${event.minute}-${index}`}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: "auto" }}
              className={`mb-3 p-3 rounded-lg border-l-4 ${
                event.type.includes('GOAL') ? 'bg-[#009DDC]/20 border-[#009DDC]' : 
                event.type.includes('CARD') ? 'bg-yellow-500/10 border-yellow-500' :
                'bg-white/5 border-gray-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm text-gray-400 min-w-[30px] pt-1">{event.minute}'</span>
                <div>
                  <div className="font-bold text-sm text-gray-300">
                    {event.type === 'GOAL_HOME' ? `⚽ BUT POUR ${match.home_team_name} !` :
                     event.type === 'GOAL_AWAY' ? `⚽ BUT POUR ${match.away_team_name} !` :
                     event.type.replace('_', ' ')}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">{event.description}</div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {displayEvents.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 opacity-50">
              <span className="text-4xl mb-2">⚡</span>
              <p>En attente du coup d'envoi...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}