"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Activity, Zap, Shield, TrendingUp } from 'lucide-react';
import { simulateMatch } from '../lib/api';

// --- TYPES ---
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

const mockMatchData: Match = {
  id: 1, home_team_name: "Olympique Marseille", away_team_name: "Paris SG",
  match_log: [], played: false, home_score: 0, away_score: 0
};

// ==========================================
// COMPOSANT PRINCIPAL
// ==========================================
export default function MatchLiveInterface({ matchData }: { matchData?: Match }) {
  const [match, setMatch] = useState(matchData || mockMatchData);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>([]);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Simulation joueurs
  const omPlayers = useMemo(() => ['Aubameyang', 'Harit', 'Veretout', 'Clauss', 'Balerdi', 'Lopez'], []);
  const psgPlayers = useMemo(() => ['Mbappé', 'Dembélé', 'Vitinha', 'Hakimi', 'Marquinhos', 'Donnarumma'], []);
  const [ratings, setRatings] = useState<{om: any[], psg: any[]} | null>(null);

  useEffect(() => {
    setRatings({
      om: omPlayers.map(() => ({ score: (Math.random() * 2 + 5.5).toFixed(1), width: Math.random() * 40 + 40 })),
      psg: psgPlayers.map(() => ({ score: (Math.random() * 2 + 5.0).toFixed(1), width: Math.random() * 40 + 40 }))
    });
  }, [omPlayers, psgPlayers]);

  // Logique de jeu (inchangée mais nettoyée)
  const handleStart = async () => {
    if (match.played || match.match_log.length > 0) {
      if (currentMinute >= 90) { setCurrentMinute(0); setDisplayEvents([]); setLiveScore({ home: 0, away: 0 }); }
      setIsPlaying(!isPlaying); return;
    }
    setIsLoading(true);
    const result = await simulateMatch(match.id);
    setIsLoading(false);
    if (result?.details) { setMatch(result.details); setIsPlaying(true); }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentMinute < 90) {
      interval = setInterval(() => {
        setCurrentMinute((prev) => {
          const next = prev + 1;
          const newEvents = match.match_log.filter(e => e.minute === next);
          if (newEvents.length > 0) {
            setDisplayEvents(curr => [...newEvents.filter(ne => !curr.some(e => e.minute === ne.minute && e.type === ne.type)), ...curr]);
            if (newEvents[newEvents.length - 1].current_score) setLiveScore(newEvents[newEvents.length - 1].current_score);
          }
          return next;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMinute, match.match_log]);

  // --- RENDER ---
  return (
    <div className="relative w-full max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8 h-screen flex flex-col gap-6">
      
      {/* 1. HEADER (Compact & Modern) */}
      <header className="flex justify-between items-center h-16 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-black font-tech">OM</div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none tracking-tight">OM ANALYTICS</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider uppercase mt-1">Live AI Dashboard</p>
          </div>
        </div>
        <button 
          onClick={handleStart}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-black font-bold text-sm uppercase tracking-wide hover:scale-105 transition-transform disabled:opacity-50"
        >
          {isLoading ? "Chargement..." : isPlaying ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Lancer Simulation</>}
        </button>
      </header>

      {/* 2. BENTO GRID (Layout Intelligent qui s'adapte) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0"> {/* min-h-0 est crucial pour le scroll interne */}
        
        {/* COL GAUCHE : Score & Stats (Fixe) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ScoreBoard home={match.home_team_name} away={match.away_team_name} score={liveScore} minute={currentMinute} />
          
          <div className="grid grid-cols-3 gap-6 h-32">
            <StatCard label="Possession" value={`${50 + Math.round(Math.sin(currentMinute)*5)}%`} icon={<Activity size={18} />} color="text-cyan-400" />
            <StatCard label="Danger (xG)" value={(displayEvents.length * 0.12).toFixed(2)} icon={<Zap size={18} />} color="text-amber-400" />
            <StatCard label="Défense" value="Haut" icon={<Shield size={18} />} color="text-emerald-400" />
          </div>

          <div className="flex-1 bento-card p-6 min-h-[300px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Performances Joueurs (Live)</h3>
               <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  <span className="text-[10px] text-slate-500 uppercase">OM</span>
                  <div className="w-2 h-2 rounded-full bg-white ml-2"></div>
                  <span className="text-[10px] text-slate-500 uppercase">PSG</span>
               </div>
             </div>
             
             <div className="flex-1 grid grid-cols-2 gap-12 overflow-y-auto no-scrollbar">
                {ratings ? (
                  <>
                    <PlayerList players={omPlayers} ratings={ratings.om} color="bg-cyan-500" />
                    <PlayerList players={psgPlayers} ratings={ratings.psg} color="bg-white" />
                  </>
                ) : (
                  <div className="col-span-2 flex items-center justify-center text-slate-600 text-sm">En attente de données...</div>
                )}
             </div>
          </div>
        </div>

        {/* COL DROITE : Le Feed (Scrollable) */}
        <div className="lg:col-span-4 bento-card p-0 flex flex-col h-full overflow-hidden relative">
          <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-md z-10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Fil du match
            </h3>
          </div>
          
          {/* Container Scrollable */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 relative">
             {/* Ombre en haut pour effet de profondeur */}
             <div className="sticky top-0 h-4 bg-gradient-to-b from-[#030712]/50 to-transparent z-10 pointer-events-none"></div>
             
             <AnimatePresence mode='popLayout'>
                {displayEvents.map((event, i) => (
                  <FeedItem key={`${event.minute}-${i}`} event={event} />
                ))}
             </AnimatePresence>

             {displayEvents.length === 0 && (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                 <TrendingUp size={32} className="mb-2" />
                 <span className="text-xs uppercase tracking-widest">En attente du coup d'envoi</span>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ==========================================
// SOUS-COMPOSANTS (Propres & Stylés)
// ==========================================

function ScoreBoard({ home, away, score, minute }: any) {
  return (
    <div className="h-64 bento-card relative overflow-hidden flex flex-col justify-center items-center group">
      {/* Background dynamique */}
      <div className={`absolute inset-0 opacity-20 blur-[100px] transition-colors duration-700
         ${score.home > score.away ? 'bg-cyan-600' : score.away > score.home ? 'bg-red-600' : 'bg-slate-800'}
      `}></div>
      
      <div className="relative z-10 w-full px-8 md:px-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <h2 className="text-3xl md:text-5xl font-black text-white font-tech uppercase tracking-tighter leading-none">{home}</h2>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Domicile</span>
        </div>

        <div className="flex flex-col items-center mx-4 md:mx-12">
           <div className="flex items-center gap-8 mb-4">
             <span className="text-7xl md:text-9xl font-black text-white font-tech leading-none">{score.home}</span>
             <div className="w-px h-16 bg-white/10"></div>
             <span className="text-7xl md:text-9xl font-black text-slate-400 font-tech leading-none">{score.away}</span>
           </div>
           <div className="px-4 py-1 rounded-full border border-white/10 bg-black/30 backdrop-blur-md text-cyan-400 font-mono font-bold text-lg">
             {minute}<span className="animate-pulse">'</span>
           </div>
        </div>

        <div className="text-left">
          <h2 className="text-3xl md:text-5xl font-black text-white font-tech uppercase tracking-tighter leading-none">{away}</h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extérieur</span>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ event }: { event: MatchEvent }) {
  const isGoal = event.type.includes('GOAL');
  const isCard = event.type === 'CARD';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={`p-4 rounded-xl border backdrop-blur-md flex gap-4 ${
        isGoal ? 'bg-cyan-900/10 border-cyan-500/40 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]' :
        isCard ? 'bg-amber-900/10 border-amber-500/40' :
        'bg-white/5 border-white/5 hover:bg-white/10'
      }`}
    >
      <div className="flex flex-col items-center justify-start pt-1">
        <span className={`text-lg font-bold font-mono ${isGoal ? 'text-cyan-400' : isCard ? 'text-amber-400' : 'text-slate-500'}`}>
          {event.minute}'
        </span>
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
             isGoal ? 'bg-cyan-500 text-black' : isCard ? 'bg-amber-500 text-black' : 'bg-white/10 text-slate-400'
          }`}>
            {event.type.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-slate-300 font-medium leading-relaxed">{event.description}</p>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <div className="bento-card flex flex-col items-center justify-center gap-2 hover:bg-white/5">
      <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
      <span className="text-2xl font-bold text-white font-tech">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function PlayerList({ players, ratings, color }: any) {
  return (
    <div className="space-y-3">
      {players.map((p: string, i: number) => (
        <div key={i} className="group">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300 group-hover:text-white transition-colors">{p}</span>
            <span className={`font-mono font-bold ${parseFloat(ratings[i].score) > 7 ? 'text-white' : 'text-slate-500'}`}>
              {ratings[i].score}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }} 
              animate={{ width: `${ratings[i].width}%` }} 
              className={`h-full ${color} opacity-60 group-hover:opacity-100`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}