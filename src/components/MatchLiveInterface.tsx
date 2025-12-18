"use client";
import { useState, useEffect, useMemo } from 'react';
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

  // Listes des joueurs pour l'affichage et l'attribution des cartons
  const omPlayers = useMemo(() => ['Aubameyang', 'Harit', 'Veretout', 'Clauss', 'Balerdi'], []);
  const psgPlayers = useMemo(() => ['Mbappé', 'Dembélé', 'Vitinha', 'Hakimi', 'Marquinhos'], []);

  const [randomRatings, setRandomRatings] = useState<{om: any[], psg: any[]} | null>(null);

  // Génération unique des notes au chargement
  useEffect(() => {
    setRandomRatings({
      om: omPlayers.map(() => ({
        width: Math.random() * 30 + 60,
        score: (Math.random() * 2 + 6).toFixed(1)
      })),
      psg: psgPlayers.map(() => ({
        width: Math.random() * 30 + 50,
        score: (Math.random() * 2 + 5).toFixed(1)
      }))
    });
  }, [omPlayers, psgPlayers]);

  // Calcul des stats basé sur les événements affichés
  const stats = {
    home_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL_HOME")).length,
    away_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL_AWAY")).length,
    // On compte les cartons en cherchant le nom de l'équipe dans la description (ajouté par notre logique ci-dessous)
    home_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.home_team_name)).length,
    away_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.away_team_name)).length,
    possession: 50 + (Math.sin(currentMinute / 10) * 5) 
  };

  const handleStart = async () => {
    if (match.played || match.match_log.length > 0) {
      if (currentMinute >= 90) {
        setCurrentMinute(0);
        setDisplayEvents([]);
        setLiveScore({ home: 0, away: 0 });
      }
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

  // Moteur de lecture du match
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentMinute < 90) {
      interval = setInterval(() => {
        setCurrentMinute((prev) => {
          const nextMinute = prev + 1;
          const rawEvents = match.match_log.filter(e => e.minute === nextMinute);
          
          if (rawEvents.length > 0) {
            // --- LOGIQUE D'ATTRIBUTION DES CARTONS ---
            const processedEvents = rawEvents.map(event => {
                if (event.type === 'CARD') {
                    const enhancedEvent = { ...event };
                    
                    // On détermine l'équipe fautive (au hasard si le backend ne le dit pas)
                    const isHomeFault = Math.random() > 0.5;
                    
                    if (isHomeFault) {
                        const randomPlayer = omPlayers[Math.floor(Math.random() * omPlayers.length)];
                        enhancedEvent.description = `Carton jaune pour ${randomPlayer} (${match.home_team_name})`;
                    } else {
                        const randomPlayer = psgPlayers[Math.floor(Math.random() * psgPlayers.length)];
                        enhancedEvent.description = `Carton jaune pour ${randomPlayer} (${match.away_team_name})`;
                    }
                    return enhancedEvent;
                }
                return event;
            });

            setDisplayEvents(prevEvents => {
              const existingIds = new Set(prevEvents.map(e => `${e.minute}-${e.type}`));
              const uniqueNew = processedEvents.filter(e => !existingIds.has(`${e.minute}-${e.type}`));
              return [...uniqueNew, ...prevEvents];
            });

            const lastEvent = rawEvents[rawEvents.length - 1];
            if (lastEvent.current_score) setLiveScore(lastEvent.current_score);
          }
          return nextMinute;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMinute, match.match_log, match.home_team_name, match.away_team_name, omPlayers, psgPlayers]);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* --- SCOREBOARD --- */}
      <div className="relative overflow-hidden backdrop-blur-xl border-2 border-[#009DDC]/30 shadow-[0_0_30px_rgba(0,157,220,0.2)] rounded-3xl bg-slate-900/90 p-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#009DDC]/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex justify-between items-center mb-12 border-b-2 border-[#009DDC]/20 pb-8">
          <div className="text-center w-1/3">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{match.home_team_name}</h2>
            <div className="text-8xl font-black text-[#009DDC] drop-shadow-[0_0_25px_rgba(0,157,220,0.6)] font-mono">
              {liveScore.home}
            </div>
          </div>

          <div className="flex flex-col items-center w-1/3 space-y-6">
            <div className="text-3xl font-mono text-[#D3A400] font-bold border-2 border-[#D3A400]/50 px-8 py-3 rounded-xl bg-[#D3A400]/10 shadow-[0_0_20px_rgba(211,164,0,0.3)]">
              {currentMinute > 90 ? "90+" : currentMinute}<span className="text-lg">'</span>
            </div>
            
            <button 
              onClick={handleStart}
              disabled={isLoading}
              className={`px-10 py-4 rounded-full font-bold transition-all transform hover:scale-105 shadow-lg text-lg tracking-wider
                ${isLoading ? 'bg-gray-700 text-gray-400 cursor-wait' : 'bg-gradient-to-r from-[#009DDC] to-[#0077A6] text-white hover:shadow-[0_0_30px_rgba(0,157,220,0.6)]'}
              `}
            >
              {isLoading ? "IA CALCUL..." : 
               currentMinute >= 90 ? "REVOIR" :
               isPlaying ? "PAUSE" : 
               match.played ? "LECTURE" : "SIMULER"}
            </button>
          </div>

          <div className="text-center w-1/3">
            <h2 className="text-4xl font-black text-white mb-2 tracking-tight">{match.away_team_name}</h2>
            <div className="text-8xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)] font-mono">
              {liveScore.away}
            </div>
          </div>
        </div>

        {/* --- STATISTIQUES --- */}
        <div className="mb-12">
            <h3 className="text-center text-sm font-bold text-[#009DDC] uppercase tracking-[0.3em] mb-8 bg-[#009DDC]/10 py-2 rounded-full mx-auto w-1/3 border border-[#009DDC]/30">
              Statistiques du Match
            </h3>
            <div className="space-y-6 px-8">
                <PossessionBar homeValue={Math.round(stats.possession)} awayValue={Math.round(100 - stats.possession)} />
                <StatRow label="Tirs / Occasions" homeValue={stats.home_shots} awayValue={stats.away_shots} />
                <StatRow label="Cartons" homeValue={stats.home_cards} awayValue={stats.away_cards} color="yellow"/>
                <StatRow label="Fautes" homeValue={Math.round(stats.home_cards * 2 + 3)} awayValue={Math.round(stats.away_cards * 2 + 4)} />
            </div>
        </div>

        {/* --- PERFORMACES JOUEURS --- */}
        {match.played && randomRatings && (
          <div className="pt-10 border-t-2 border-[#009DDC]/20">
            <h3 className="text-center text-sm font-bold text-[#D3A400] uppercase tracking-[0.3em] mb-10 bg-[#D3A400]/10 py-2 rounded-full mx-auto w-1/3 border border-[#D3A400]/30">
              Performances Joueurs
            </h3>
            <div className="flex justify-between gap-24 px-4">
              {/* OM */}
              <div className="w-1/2 space-y-6">
                {omPlayers.map((player, i) => (
                  <div key={i} className="flex justify-between items-center group cursor-default p-3 hover:bg-white/5 rounded-xl transition-all">
                    <span className="text-gray-300 group-hover:text-white transition-colors text-lg font-bold">{player}</span>
                    <div className="flex items-center gap-6">
                      <div className="h-3 w-48 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                        {/* Zéro trait au milieu */}
                        <div style={{width: `${randomRatings.om[i].width}%`}} className="h-full bg-gradient-to-r from-[#009DDC] to-[#00BBFF] shadow-[0_0_10px_#009DDC]"></div>
                      </div>
                      <span className={`font-mono font-black text-xl w-12 text-right ${i===0 ? 'text-[#D3A400]' : 'text-white'}`}>
                        {randomRatings.om[i].score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* PSG */}
              <div className="w-1/2 space-y-6 text-right">
                {psgPlayers.map((player, i) => (
                  <div key={i} className="flex justify-between items-center flex-row-reverse group cursor-default p-3 hover:bg-white/5 rounded-xl transition-all">
                    <span className="text-gray-300 group-hover:text-white transition-colors text-lg font-bold">{player}</span>
                    <div className="flex items-center gap-6 flex-row-reverse">
                       <div className="h-3 w-48 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                        {/* Zéro trait au milieu */}
                        <div style={{width: `${randomRatings.psg[i].width}%`}} className="h-full bg-gradient-to-r from-red-600 to-red-400 shadow-[0_0_10px_red]"></div>
                      </div>
                      <span className="font-mono font-black text-xl w-12 text-left text-white">
                        {randomRatings.psg[i].score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- FIL DU MATCH --- */}
      <div className="p-8 rounded-3xl bg-slate-900/80 border-2 border-[#009DDC]/20 h-[400px] overflow-y-auto custom-scrollbar shadow-xl">
        <h3 className="text-sm font-bold text-[#009DDC] uppercase tracking-widest mb-6 sticky top-0 bg-slate-900/95 py-4 z-10 w-full border-b border-[#009DDC]/20 backdrop-blur-md">
          Fil du match en direct
        </h3>
        <AnimatePresence>
          {displayEvents.map((event, index) => (
            <motion.div
              key={`${event.minute}-${index}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 mb-4 text-base group"
            >
              <span className="font-mono text-[#D3A400] w-12 text-right font-black pt-3 text-lg">{event.minute}'</span>
              <div className={`px-6 py-4 rounded-2xl flex-1 border-2 transition-all shadow-md ${
                  event.type.includes('GOAL') ? 'bg-[#009DDC]/20 border-[#009DDC] text-white shadow-[0_0_15px_rgba(0,157,220,0.3)]' : 
                  event.type === 'CARD' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-100' : 
                  'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}>
                <div className="font-black mb-2 uppercase tracking-wider flex items-center gap-2">
                    {event.type.includes('GOAL') ? <>⚽ BUT !</> : event.type === 'CARD' ? <>🟨 CARTON</> : <>⚡ ACTION</>}
                </div>
                <div className="text-lg leading-relaxed">{event.description}</div>
              </div>
            </motion.div>
          ))}
          {displayEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 italic animate-pulse text-xl">
                <span>Le match va commencer...</span>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// --- SOUS-COMPOSANTS PROPRES (SANS TRAIT) ---

function PossessionBar({ homeValue, awayValue }: { homeValue: number, awayValue: number }) {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="font-mono font-bold text-2xl text-[#009DDC] w-20 text-right">{homeValue}%</span>
      <div className="flex-1 h-6 bg-gray-800 rounded-full overflow-hidden flex border border-white/10 shadow-inner">
          <div style={{ width: `${homeValue}%` }} className="h-full bg-gradient-to-r from-[#009DDC] to-[#00BBFF] transition-all duration-1000 ease-out shadow-[0_0_15px_#009DDC]"></div>
          <div style={{ width: `${awayValue}%` }} className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 ease-out shadow-[0_0_15px_red]"></div>
      </div>
      <span className="font-mono font-bold text-2xl text-red-500 w-20 text-left">{awayValue}%</span>
    </div>
  );
}

function StatRow({ label, homeValue, awayValue, color = "blue" }: { label: string, homeValue: number, awayValue: number, color?: string }) {
  const total = (homeValue + awayValue) || 1;
  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;
  const bgColor = color === "yellow" ? "from-yellow-500 to-yellow-300" : "from-[#009DDC] to-[#00BBFF]";
  const shadowColor = color === "yellow" ? "yellow" : "#009DDC";

  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-4 flex-1 justify-end">
        <span className="font-mono font-bold text-2xl text-white">{homeValue}</span>
        <div className="h-4 w-full max-w-[150px] bg-gray-800 rounded-full overflow-hidden border border-white/10 flex justify-end">
          <div style={{ width: `${homePercent}%` }} className={`h-full bg-gradient-to-r ${bgColor} transition-all duration-1000 ease-out shadow-[0_0_10px_${shadowColor}] rounded-full`}></div>
        </div>
      </div>
      <span className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center w-40 px-2 shrink-0">
          {label}
      </span>
      <div className="flex items-center gap-4 flex-1">
        <div className="h-4 w-full max-w-[150px] bg-gray-800 rounded-full overflow-hidden border border-white/10">
          <div style={{ width: `${awayPercent}%` }} className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-1000 ease-out shadow-[0_0_10px_red] rounded-full"></div>
        </div>
        <span className="font-mono font-bold text-2xl text-white">{awayValue}</span>
      </div>
    </div>
  );
}