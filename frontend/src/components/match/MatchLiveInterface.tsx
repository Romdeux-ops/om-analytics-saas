"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Activity, Zap, Shield, TrendingUp, Users } from "lucide-react";
import { simulateMatchAction } from "@/src/app/actions/match";
import { Button } from "@/src/components/ui/Button";
import { LineupPitch, SubstitutesBench } from "@/src/components/simulation/LineupPitch";
import type { MatchEvent, MatchView } from "@/src/lib/types/match";
import type { MatchLineups, ProbableLineup, RosterPlayer } from "@/src/lib/types/lineup";

// ---------------------------------------------------------------------------
// Hook : récupérer les compositions côté client
// ---------------------------------------------------------------------------

function useMatchLineups(homeTeam: string, awayTeam: string) {
  const [lineups, setLineups] = useState<MatchLineups | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLineups() {
      setLoading(true);
      setError(null);

      try {
        const [homeRes, awayRes] = await Promise.all([
          fetch(`/api/lineup/${encodeURIComponent(homeTeam)}`),
          fetch(`/api/lineup/${encodeURIComponent(awayTeam)}`),
        ]);

        if (!homeRes.ok || !awayRes.ok) {
          throw new Error("Impossible de charger les compositions");
        }

        const home = (await homeRes.json()) as ProbableLineup;
        const away = (await awayRes.json()) as ProbableLineup;

        if (!cancelled) {
          setLineups({ home, away, homeTeam, awayTeam });
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur inconnue");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLineups();
    return () => { cancelled = true; };
  }, [homeTeam, awayTeam]);

  return { lineups, loading, error };
}

// ---------------------------------------------------------------------------
// Composant principal
// ---------------------------------------------------------------------------

export default function MatchLiveInterface({ matchData }: { matchData: MatchView }) {
  const [match, setMatch] = useState(matchData);
  const [isLoading, setIsLoading] = useState(false);

  const { lineups, loading: lineupsLoading } = useMatchLineups(
    match.home_team_name,
    match.away_team_name,
  );

  // Extraire les joueurs pour les performances live
  const homePlayers = useMemo(
    () => lineups?.home.starters.map((s) => s.player) ?? [],
    [lineups],
  );
  const awayPlayers = useMemo(
    () => lineups?.away.starters.map((s) => s.player) ?? [],
    [lineups],
  );

  const onSimulate = useCallback(async () => {
    setIsLoading(true);
    const result = await simulateMatchAction(match.id);
    setIsLoading(false);
    if ("details" in result && result.details) {
      setMatch(result.details);
      return true;
    }
    return false;
  }, [match.id]);

  return (
    <LivePlayback match={match} isLoading={isLoading} onSimulate={onSimulate}>
      {/* Compositions pré-match */}
      {!match.played && match.match_log.length === 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-cyan-400" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
              Compositions probables
            </h3>
            {lineupsLoading && (
              <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                <span className="pulse-dot" /> Chargement…
              </span>
            )}
          </div>

          {lineups && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-3">
                <LineupPitch lineup={lineups.home} teamName={lineups.homeTeam} />
                <SubstitutesBench substitutes={lineups.home.substitutes} teamName={lineups.homeTeam} />
              </div>
              <div className="space-y-3">
                <LineupPitch lineup={lineups.away} teamName={lineups.awayTeam} />
                <SubstitutesBench substitutes={lineups.away.substitutes} teamName={lineups.awayTeam} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performances live (pendant/après simulation) */}
      {(match.played || match.match_log.length > 0) && (
        <PlayerPerformances homePlayers={homePlayers} awayPlayers={awayPlayers} />
      )}
    </LivePlayback>
  );
}

// ---------------------------------------------------------------------------
// LivePlayback (simulation en temps réel)
// ---------------------------------------------------------------------------

function LivePlayback({
  match,
  isLoading,
  onSimulate,
  children,
}: {
  match: MatchView;
  isLoading: boolean;
  onSimulate: () => Promise<boolean>;
  children: ReactNode;
}) {
  const [currentMinute, setCurrentMinute] = useState(0);
  const [displayEvents, setDisplayEvents] = useState<MatchEvent[]>([]);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const minuteRef = useRef(0);

  async function handleStart() {
    if (match.played || match.match_log.length > 0) {
      if (minuteRef.current >= 90) {
        minuteRef.current = 0;
        setCurrentMinute(0);
        setDisplayEvents([]);
        setLiveScore({ home: 0, away: 0 });
      }
      setIsPlaying((playing) => !playing);
      return;
    }
    const started = await onSimulate();
    if (started) setIsPlaying(true);
  }

  useEffect(() => {
    if (!isPlaying) return;
    const log = match.match_log;
    const interval = setInterval(() => {
      if (minuteRef.current >= 90) return;
      const next = minuteRef.current + 1;
      minuteRef.current = next;
      setCurrentMinute(next);
      const newEvents = log.filter((e) => e.minute === next);
      if (newEvents.length === 0) return;
      setDisplayEvents((curr) => [
        ...newEvents.filter(
          (ne) => !curr.some((e) => e.minute === ne.minute && e.type === ne.type),
        ),
        ...curr,
      ]);
      const score = newEvents[newEvents.length - 1].current_score;
      if (score) setLiveScore(score);
    }, 150);
    return () => clearInterval(interval);
  }, [isPlaying, match.match_log]);

  return (
    <div className="flex min-h-[70vh] w-full max-w-[1600px] flex-col gap-6">
      <header className="flex h-16 shrink-0 items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-tech text-xl font-bold leading-none tracking-tight text-white">
              SIMULATION LIVE
            </h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">
              {match.home_team_name} vs {match.away_team_name}
            </p>
          </div>
        </div>
        <Button onClick={handleStart} loading={isLoading}>
          {isPlaying ? (
            <>
              <Pause size={14} /> Pause
            </>
          ) : (
            <>
              <Play size={14} /> Lancer Simulation
            </>
          )}
        </Button>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <div className="lg:col-span-8 flex flex-col gap-6">
          <ScoreBoard
            home={match.home_team_name}
            away={match.away_team_name}
            score={liveScore}
            minute={currentMinute}
          />

          <div className="grid grid-cols-3 gap-6 h-32">
            <StatCard
              label="Possession"
              value={`${50 + Math.round(Math.sin(currentMinute) * 5)}%`}
              icon={<Activity size={18} />}
              color="text-cyan-400"
            />
            <StatCard
              label="Danger (xG)"
              value={(displayEvents.length * 0.12).toFixed(2)}
              icon={<Zap size={18} />}
              color="text-amber-400"
            />
            <StatCard
              label="Défense"
              value="Haut"
              icon={<Shield size={18} />}
              color="text-emerald-400"
            />
          </div>

          {children}
        </div>

        <div className="lg:col-span-4 bento-card p-0 flex flex-col h-full overflow-hidden relative min-h-[400px]">
          <div className="p-5 border-b border-white/5 bg-white/5 z-10">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Fil du match
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3 relative">
            <AnimatePresence>
              {displayEvents.map((event, i) => (
                <FeedItem key={`${event.minute}-${event.type}-${i}`} event={event} />
              ))}
            </AnimatePresence>
            {displayEvents.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 opacity-50">
                <TrendingUp size={32} className="mb-2" />
                <span className="text-xs uppercase tracking-widest">
                  En attente du coup d&apos;envoi
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Performances joueurs (dynamiques)
// ---------------------------------------------------------------------------

const PlayerPerformances = memo(function PlayerPerformances({
  homePlayers,
  awayPlayers,
}: {
  homePlayers: RosterPlayer[];
  awayPlayers: RosterPlayer[];
}) {
  // Notes aléatoires uniquement côté client
  const [ratings, setRatings] = useState<{
    home: { score: string; width: number }[];
    away: { score: string; width: number }[];
  } | null>(null);

  useEffect(() => {
    if (homePlayers.length === 0 && awayPlayers.length === 0) return;
    setRatings({
      home: homePlayers.slice(0, 8).map(() => ({
        score: (Math.random() * 2 + 5.5).toFixed(1),
        width: Math.random() * 40 + 40,
      })),
      away: awayPlayers.slice(0, 8).map(() => ({
        score: (Math.random() * 2 + 5.0).toFixed(1),
        width: Math.random() * 40 + 40,
      })),
    });
  }, [homePlayers, awayPlayers]);

  return (
    <div className="flex-1 bento-card p-6 min-h-[300px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Performances Joueurs (Live)
        </h3>
      </div>
      <div className="flex-1 grid grid-cols-2 gap-12 overflow-y-auto no-scrollbar">
        {ratings ? (
          <>
            <PlayerList
              players={homePlayers.slice(0, 8).map((p) => p.shortName)}
              ratings={ratings.home}
              color="bg-cyan-500"
            />
            <PlayerList
              players={awayPlayers.slice(0, 8).map((p) => p.shortName)}
              ratings={ratings.away}
              color="bg-white"
            />
          </>
        ) : (
          <div className="col-span-2 flex items-center justify-center text-slate-600 text-sm">
            En attente de données...
          </div>
        )}
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Sous-composants inchangés
// ---------------------------------------------------------------------------

function ScoreBoard({
  home,
  away,
  score,
  minute,
}: {
  home: string;
  away: string;
  score: { home: number; away: number };
  minute: number;
}) {
  return (
    <div className="h-64 bento-card relative overflow-hidden flex flex-col justify-center items-center">
      <div
        className={`absolute inset-0 opacity-20 blur-[100px] transition-colors duration-700 ${
          score.home > score.away
            ? "bg-cyan-600"
            : score.away > score.home
              ? "bg-red-600"
              : "bg-slate-800"
        }`}
      />
      <div className="relative z-10 w-full px-8 md:px-16 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
        <div className="text-right">
          <h2 className="text-2xl md:text-4xl font-black text-white font-tech uppercase tracking-tighter leading-none">
            {home}
          </h2>
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Domicile</span>
        </div>
        <div className="flex flex-col items-center mx-4 md:mx-8">
          <div className="flex items-center gap-6 mb-4">
            <span className="text-6xl md:text-8xl font-black text-white font-tech leading-none">
              {score.home}
            </span>
            <div className="w-px h-12 bg-white/10" />
            <span className="text-6xl md:text-8xl font-black text-slate-400 font-tech leading-none">
              {score.away}
            </span>
          </div>
          <div className="px-4 py-1 rounded-full border border-white/10 bg-black/30 text-cyan-400 font-mono font-bold text-lg">
            {minute}
            <span className="animate-pulse">&apos;</span>
          </div>
        </div>
        <div className="text-left">
          <h2 className="text-2xl md:text-4xl font-black text-white font-tech uppercase tracking-tighter leading-none">
            {away}
          </h2>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extérieur</span>
        </div>
      </div>
    </div>
  );
}

function FeedItem({ event }: { event: MatchEvent }) {
  const isGoal = event.type.includes("GOAL");
  const isCard = event.type === "YELLOW_CARD";

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className={`p-4 rounded-xl border flex gap-4 ${
        isGoal
          ? "bg-cyan-900/10 border-cyan-500/40 shadow-[0_0_30px_-10px_rgba(6,182,212,0.3)]"
          : isCard
            ? "bg-amber-900/10 border-amber-500/40"
            : "bg-white/5 border-white/5"
      }`}
    >
      <span
        className={`text-lg font-bold font-mono ${isGoal ? "text-cyan-400" : isCard ? "text-amber-400" : "text-slate-500"}`}
      >
        {event.minute}&apos;
      </span>
      <div className="flex-1">
        <span
          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
            isGoal
              ? "bg-cyan-500 text-black"
              : isCard
                ? "bg-amber-500 text-black"
                : "bg-white/10 text-slate-400"
          }`}
        >
          {event.type.replace("_", " ")}
        </span>
        <p className="text-sm text-slate-300 font-medium leading-relaxed mt-1">
          {event.description}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bento-card flex flex-col items-center justify-center gap-2">
      <div className={`p-2 rounded-lg bg-white/5 ${color}`}>{icon}</div>
      <span className="text-2xl font-bold text-white font-tech">{value}</span>
      <span className="text-[10px] text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}

function PlayerList({
  players,
  ratings,
  color,
}: {
  players: string[];
  ratings: { score: string; width: number }[];
  color: string;
}) {
  return (
    <div className="space-y-3">
      {players.map((p, i) => (
        <div key={p}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-300">{p}</span>
            <span
              className={`font-mono font-bold ${parseFloat(ratings[i].score) > 7 ? "text-white" : "text-slate-500"}`}
            >
              {ratings[i].score}
            </span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${ratings[i].width}%` }}
              className={`h-full ${color}`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
