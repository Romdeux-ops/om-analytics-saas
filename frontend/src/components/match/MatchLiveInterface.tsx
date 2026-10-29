"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { simulateMatchAction } from "@/src/app/actions/match";
import { Button } from "@/src/components/ui/Button";
import { LineupPitch, SubstitutesBench, UnavailablePlayersSection } from "@/src/components/simulation/LineupPitch";
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

export default function MatchLiveInterface({
  matchData,
  initialLineups,
}: {
  matchData: MatchView;
  initialLineups?: MatchLineups | null;
}) {
  const [match, setMatch] = useState(matchData);
  const [isLoading, setIsLoading] = useState(false);

  const { lineups: fetchedLineups, loading: lineupsLoading } = useMatchLineups(
    match.home_team_name,
    match.away_team_name,
  );

  const lineups = initialLineups ?? fetchedLineups;

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
          <div className="flex items-baseline justify-between border-t-[6px] border-ink pt-2">
            <h3 className="display text-3xl">Compositions probables</h3>
            {lineupsLoading && <span className="label text-ink/50">Chargement…</span>}
          </div>

          {lineups && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0">
              <div className="space-y-6 lg:border-r lg:border-ink lg:pr-8">
                <LineupPitch lineup={lineups.home} teamName={lineups.homeTeam} />
                <SubstitutesBench substitutes={lineups.home.substitutes} teamName={lineups.homeTeam} />
                <UnavailablePlayersSection unavailable={lineups.home.unavailable ?? []} teamName={lineups.homeTeam} />
              </div>
              <div className="space-y-6 lg:pl-8">
                <LineupPitch lineup={lineups.away} teamName={lineups.awayTeam} />
                <SubstitutesBench substitutes={lineups.away.substitutes} teamName={lineups.awayTeam} />
                <UnavailablePlayersSection unavailable={lineups.away.unavailable ?? []} teamName={lineups.awayTeam} />
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
    <div className="flex min-h-[70vh] w-full flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-3">
        <div>
          <p className="label flex items-center gap-2">
            <span className={isPlaying ? "pulse-dot text-live" : "inline-block h-2 w-2 bg-ink/30"} aria-hidden="true" />
            Simulation live
          </p>
          <h2 className="display mt-1 text-4xl md:text-5xl">
            {match.home_team_name} <span className="editorial text-3xl normal-case text-ink/50">contre</span>{" "}
            {match.away_team_name}
          </h2>
        </div>
        <Button onClick={handleStart} loading={isLoading}>
          {isPlaying ? "Pause ‖" : "Lancer la simulation →"}
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0">
        <div className="flex flex-col gap-10 lg:col-span-8 lg:border-r lg:border-ink lg:pr-8">
          <ScoreBoard
            home={match.home_team_name}
            away={match.away_team_name}
            score={liveScore}
            minute={currentMinute}
          />

          <dl className="grid grid-cols-3 border-y border-ink">
            <StatCard label="Possession" value={`${50 + Math.round(Math.sin(currentMinute) * 5)}%`} />
            <StatCard label="Danger (xG)" value={(displayEvents.length * 0.12).toFixed(2)} />
            <StatCard label="Bloc défensif" value="Haut" />
          </dl>

          {children}
        </div>

        <div className="relative flex min-h-[400px] flex-col lg:col-span-4 lg:pl-8">
          <h3 className="flex items-baseline justify-between border-t-[6px] border-ink pt-2">
            <span className="display text-3xl">Fil du match</span>
            <span className="label tabular text-ink/50">{currentMinute}&apos;</span>
          </h3>
          <div className="no-scrollbar relative mt-2 max-h-[70vh] flex-1 overflow-y-auto">
            <AnimatePresence>
              {displayEvents.map((event, i) => (
                <FeedItem key={`${event.minute}-${event.type}-${i}`} event={event} />
              ))}
            </AnimatePresence>
            {displayEvents.length === 0 && (
              <p className="editorial py-10 text-2xl text-ink/45">En attente du coup d&apos;envoi…</p>
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
    <section className="flex min-h-[300px] flex-1 flex-col">
      <h3 className="flex items-baseline justify-between border-t-[6px] border-ink pt-2">
        <span className="display text-3xl">Les notes</span>
        <span className="label text-ink/50">Performances live</span>
      </h3>
      <div className="no-scrollbar mt-4 grid flex-1 grid-cols-2 gap-8 overflow-y-auto md:gap-12">
        {ratings ? (
          <>
            <PlayerList
              players={homePlayers.slice(0, 8).map((p) => p.shortName)}
              ratings={ratings.home}
              color="bg-accent"
            />
            <PlayerList
              players={awayPlayers.slice(0, 8).map((p) => p.shortName)}
              ratings={ratings.away}
              color="bg-ink"
            />
          </>
        ) : (
          <p className="editorial col-span-2 text-xl text-ink/50">En attente de données…</p>
        )}
      </div>
    </section>
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
  const leader = score.home > score.away ? "home" : score.away > score.home ? "away" : null;

  return (
    <div className="ink-block relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-paper/20 px-4 py-2">
        <span className="label text-paper/60">Tableau d&apos;affichage</span>
        <span className="label flex items-center gap-2 tabular">
          {minute > 0 && minute < 90 && <span className="pulse-dot text-live" aria-hidden="true" />}
          {minute >= 90 ? "Coup de sifflet final" : `${minute}'`}
        </span>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-4 py-8 md:px-10">
        <div className="min-w-0 text-right">
          <p className="label text-paper/50">Domicile</p>
          <h2 className="display mt-1 truncate text-3xl md:text-5xl">{home}</h2>
        </div>
        <div className="flex items-center gap-2 md:gap-3" aria-label={`Score ${score.home} à ${score.away}`}>
          <span className={`count-tile display border border-paper/30 px-3 !text-6xl leading-none md:px-5 md:!text-8xl ${leader === "home" ? "!bg-accent !text-on-accent" : ""}`}>
            <span key={score.home} className="flap">{score.home}</span>
          </span>
          <span className="display text-4xl text-paper/40">–</span>
          <span className={`count-tile display border border-paper/30 px-3 !text-6xl leading-none md:px-5 md:!text-8xl ${leader === "away" ? "!bg-accent !text-on-accent" : ""}`}>
            <span key={score.away} className="flap">{score.away}</span>
          </span>
        </div>
        <div className="min-w-0 text-left">
          <p className="label text-paper/50">Extérieur</p>
          <h2 className="display mt-1 truncate text-3xl md:text-5xl">{away}</h2>
        </div>
      </div>
      <div className="h-1.5 bg-paper/10" aria-hidden="true">
        <div className="h-full bg-accent transition-[width] duration-150" style={{ width: `${Math.min(100, (minute / 90) * 100)}%` }} />
      </div>
    </div>
  );
}

function FeedItem({ event }: { event: MatchEvent }) {
  const isGoal = event.type.includes("GOAL");
  const isCard = event.type === "YELLOW_CARD";

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`grid grid-cols-[3.5rem_1fr] gap-3 border-b py-3 ${
        isGoal ? "border-ink bg-accent px-2 text-on-accent" : "border-ink/20"
      }`}
    >
      <span className="display text-3xl leading-none tabular">{event.minute}&apos;</span>
      <div className="min-w-0">
        <span
          className={`label inline-flex items-center gap-1.5 ${isGoal ? "" : "text-ink/60"}`}
        >
          {isCard && <span className="inline-block h-3 w-2 border border-ink bg-[#f5c400]" aria-hidden="true" />}
          {event.type.replace("_", " ")}
        </span>
        <p className={`mt-1 text-[13px] leading-relaxed ${isGoal ? "font-semibold" : "text-ink/80"}`}>
          {event.description}
        </p>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-ink px-3 py-4 last:border-r-0 md:px-5">
      <dt className="label text-ink/50">{label}</dt>
      <dd className="display mt-1 text-4xl tabular md:text-5xl">{value}</dd>
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
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="truncate font-semibold uppercase">{p}</span>
            <span
              className={`display text-xl tabular ${parseFloat(ratings[i].score) > 7 ? "text-accent-text" : "text-ink/50"}`}
            >
              {ratings[i].score}
            </span>
          </div>
          <div className="h-2 w-full border border-ink">
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
