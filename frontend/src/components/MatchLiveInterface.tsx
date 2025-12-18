"use client";
import { useState, useEffect, useMemo, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, TrendingUp, Award, Zap } from 'lucide-react';

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

// Simulation de données pour la démo
const mockMatchData: Match = {
  id: 1,
  home_team_name: "Olympique Marseille",
  away_team_name: "Paris SG",
  match_log: [],
  played: false,
  home_score: 0,
  away_score: 0
};

export default function MatchLiveInterface({ matchData }: { matchData?: Match }) {
  const [match, setMatch] = useState(matchData || mockMatchData);
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>([]);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const omPlayers = useMemo(() => ['Aubameyang', 'Harit', 'Veretout', 'Clauss', 'Balerdi'], []);
  const psgPlayers = useMemo(() => ['Mbappé', 'Dembélé', 'Vitinha', 'Hakimi', 'Marquinhos'], []);
  const [randomRatings, setRandomRatings] = useState<{om: any[], psg: any[]} | null>(null);

  useEffect(() => {
    setRandomRatings({
      om: omPlayers.map(() => ({ width: Math.random() * 30 + 60, score: (Math.random() * 2 + 6).toFixed(1) })),
      psg: psgPlayers.map(() => ({ width: Math.random() * 30 + 50, score: (Math.random() * 2 + 5).toFixed(1) }))
    });
  }, [omPlayers, psgPlayers]);

  const stats = {
    home_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL_HOME")).length,
    away_shots: displayEvents.filter(e => e.description.includes("Tir") || e.type.includes("GOAL_AWAY")).length,
    home_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.home_team_name)).length,
    away_cards: displayEvents.filter(e => e.type === "CARD" && e.description.includes(match.away_team_name)).length,
    possession: 50 + (Math.sin(currentMinute / 10) * 5)
  };

  const handleStart = async () => {
    if (currentMinute >= 90) {
      setCurrentMinute(0);
      setDisplayEvents([]);
      setLiveScore({ home: 0, away: 0 });
      setMatch({...match, match_log: []});
    }
    
    if (!isPlaying && match.match_log.length === 0) {
      setIsLoading(true);
      setTimeout(() => {
        const events: MatchEvent[] = [];
        let homeScore = 0;
        let awayScore = 0;
        
        for (let i = 1; i <= 90; i++) {
          if (Math.random() > 0.85) {
            const isHome = Math.random() > 0.5;
            const isGoal = Math.random() > 0.7;
            
            if (isGoal) {
              if (isHome) homeScore++;
              else awayScore++;
            }
            
            events.push({
              minute: i,
              type: isGoal ? (isHome ? 'GOAL_HOME' : 'GOAL_AWAY') : 'ACTION',
              description: isGoal 
                ? `⚽ But ${isHome ? 'OM' : 'PSG'}! ${isHome ? omPlayers[Math.floor(Math.random()*omPlayers.length)] : psgPlayers[Math.floor(Math.random()*psgPlayers.length)]}`
                : `Tir ${isHome ? 'OM' : 'PSG'} - ${isHome ? omPlayers[Math.floor(Math.random()*omPlayers.length)] : psgPlayers[Math.floor(Math.random()*psgPlayers.length)]}`,
              current_score: { home: homeScore, away: awayScore }
            });
          }
        }
        setMatch({...match, match_log: events, played: true});
        setIsLoading(false);
        setIsPlaying(true);
      }, 1500);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && currentMinute < 90) {
      interval = setInterval(() => {
        setCurrentMinute(prev => {
          const nextMinute = prev + 1;
          const rawEvents = match.match_log.filter(e => e.minute === nextMinute);
          if (rawEvents.length > 0) {
            setDisplayEvents(prevEvents => [...rawEvents, ...prevEvents]);
            const lastEvent = rawEvents[rawEvents.length - 1];
            if (lastEvent.current_score) setLiveScore(lastEvent.current_score);
          }
          return nextMinute;
        });
      }, 150);
    } else if (currentMinute >= 90) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMinute, match.match_log]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" 
             style={{animationDuration: '4s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" 
             style={{animationDuration: '6s', animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" 
             style={{animationDuration: '8s', animationDelay: '2s'}}></div>
      </div>

      {/* Grain Texture */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none mix-blend-overlay"
           style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")"}}></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4 px-6 py-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10">
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase">Simulation Live IA</span>
          </div>
          <h1 className="text-6xl sm:text-7xl font-black tracking-tight mb-4">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
              OM ANALYTICS
            </span>
          </h1>
          <p className="text-slate-400 text-sm tracking-wide">Plateforme de Simulation Sportive Intelligente</p>
        </header>

        {/* Scoreboard */}
        <div className="mb-12 backdrop-blur-2xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
          {/* Match Info Bar */}
          <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Direct</span>
            </div>
            <div className="text-xs font-mono text-slate-500">STADE VÉLODROME</div>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-3 gap-8 items-center mb-8">
            {/* Home Team */}
            <div className="text-right space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white/90">
                {match.home_team_name}
              </h2>
              <div className="inline-block">
                <div className="text-7xl sm:text-8xl font-black bg-gradient-to-br from-cyan-400 to-blue-600 bg-clip-text text-transparent
                              drop-shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-500">
                  {liveScore.home}
                </div>
              </div>
            </div>

            {/* Center - Timer & Controls */}
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full"></div>
                <div className="relative text-center">
                  <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter">
                    {currentMinute}
                    <span className="text-yellow-400 text-4xl">'</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleStart}
                  disabled={isLoading}
                  className="group relative px-8 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 
                           hover:from-cyan-400 hover:to-blue-500 transition-all duration-300 
                           disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-cyan-500/50
                           transform hover:scale-105 active:scale-95"
                >
                  <div className="flex items-center gap-2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : currentMinute > 0 ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    <span className="font-bold text-sm">
                      {isLoading ? 'Simulation...' : isPlaying ? 'Pause' : currentMinute > 0 ? 'Reprendre' : 'Lancer'}
                    </span>
                  </div>
                </button>

                {currentMinute > 0 && (
                  <button
                    onClick={() => {
                      setCurrentMinute(0);
                      setDisplayEvents([]);
                      setLiveScore({ home: 0, away: 0 });
                      setIsPlaying(false);
                    }}
                    className="p-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 
                             transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Away Team */}
            <div className="text-left space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white/90">
                {match.away_team_name}
              </h2>
              <div className="inline-block">
                <div className="text-7xl sm:text-8xl font-black bg-gradient-to-br from-slate-300 to-slate-500 bg-clip-text text-transparent
                              drop-shadow-[0_0_30px_rgba(148,163,184,0.3)] transition-all duration-500">
                  {liveScore.away}
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-4 max-w-3xl mx-auto">
            <StatBar label="Possession" homeValue={Math.round(stats.possession)} awayValue={Math.round(100 - stats.possession)} />
            <StatBar label="Tirs" homeValue={stats.home_shots} awayValue={stats.away_shots} />
            <StatBar label="Cartons" homeValue={stats.home_cards} awayValue={stats.away_cards} color="yellow" />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Match Feed */}
          <div className="lg:col-span-7">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Fil du Match</h3>
            </div>
            
            <div className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6 h-[600px] overflow-y-auto">
              <div className="space-y-3" ref={feedRef}>
                {displayEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                    <Activity className="w-12 h-12 text-slate-500" />
                    <p className="text-sm text-slate-500">En attente du coup d'envoi...</p>
                  </div>
                ) : (
                  displayEvents.map((event, index) => {
                    const isGoal = event.type.includes('GOAL');
                    return (
                      <div
                        key={`${event.minute}-${index}`}
                        className={`group p-4 rounded-xl border transition-all duration-300 transform hover:scale-[1.02]
                          ${isGoal 
                            ? 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/5 border-cyan-500/30 shadow-lg shadow-cyan-500/20' 
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`text-2xl font-black ${isGoal ? 'text-cyan-400' : 'text-slate-500'}`}>
                            {event.minute}'
                          </div>
                          <div className="flex-1">
                            <div className={`inline-block px-3 py-1 rounded-lg text-xs font-bold mb-2
                              ${isGoal ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-slate-400'}`}>
                              {event.type.replace('_', ' ')}
                            </div>
                            <p className="text-sm font-medium text-white/90">{event.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Player Ratings */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-4 h-4 text-yellow-400" />
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Notes IA</h3>
            </div>
            
            <div className="backdrop-blur-2xl bg-white/5 rounded-2xl border border-white/10 p-6 h-[600px] overflow-y-auto">
              {match.played && randomRatings ? (
                <div className="space-y-8">
                  <PlayerSection 
                    title={match.home_team_name} 
                    players={omPlayers} 
                    ratings={randomRatings.om}
                    color="cyan"
                  />
                  <PlayerSection 
                    title={match.away_team_name} 
                    players={psgPlayers} 
                    ratings={randomRatings.psg}
                    color="slate"
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-40">
                  <Activity className="w-12 h-12 text-slate-500 animate-pulse" />
                  <p className="text-xs text-slate-500 max-w-[200px]">
                    Les performances seront calculées en temps réel
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBar({ label, homeValue, awayValue, color = 'cyan' }: any) {
  const total = homeValue + awayValue || 1;
  const homePercent = (homeValue / total) * 100;
  const awayPercent = (awayValue / total) * 100;
  const colorClass = color === 'yellow' ? 'bg-yellow-400' : 'bg-cyan-400';

  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 flex items-center justify-end gap-3">
        <span className="text-lg font-bold text-white tabular-nums">{homeValue}</span>
        <div className="w-full max-w-[120px] h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${colorClass} transition-all duration-500 rounded-full`}
            style={{ width: `${homePercent}%` }}
          ></div>
        </div>
      </div>
      
      <div className="min-w-[100px] text-center">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      
      <div className="flex-1 flex items-center gap-3">
        <div className="w-full max-w-[120px] h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className={`h-full ${color === 'yellow' ? 'bg-yellow-400' : 'bg-slate-400'} transition-all duration-500 rounded-full`}
            style={{ width: `${awayPercent}%` }}
          ></div>
        </div>
        <span className="text-lg font-bold text-white tabular-nums">{awayValue}</span>
      </div>
    </div>
  );
}

function PlayerSection({ title, players, ratings, color }: any) {
  return (
    <div className="space-y-4">
      <div className="text-center pb-3 border-b border-white/10">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</h4>
      </div>
      <div className="space-y-3">
        {players.map((player: string, i: number) => (
          <div key={i} className="flex items-center justify-between group py-2 px-3 rounded-lg hover:bg-white/5 transition-all">
            <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
              {player}
            </span>
            <div className="flex items-center gap-3">
              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                <div 
                  className={`h-full transition-all duration-500 ${color === 'cyan' ? 'bg-cyan-400' : 'bg-slate-400'}`}
                  style={{ width: `${ratings[i].width}%` }}
                ></div>
              </div>
              <span className={`font-mono font-bold text-sm tabular-nums ${
                parseFloat(ratings[i].score) > 7.5 ? 'text-yellow-400' : 'text-slate-500'
              }`}>
                {ratings[i].score}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}