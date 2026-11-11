"use client";

import { useEffect, useMemo, useState } from "react";
import type { MatchPresentationData } from "@/src/lib/data/match-presentation";
import type { MatchLineups } from "@/src/lib/types/lineup";
import {
  DEFAULT_ENGINE,
  buildSimTeam,
  runSimulation,
  syncedTime,
  toMainTime,
  type SimEvent,
  type SimulatedMatch,
} from "@/src/lib/simulation";
import { buildMultiplexFixtures } from "@/src/lib/simulation/matchday";
import { deriveSeed, randomSeed } from "@/src/lib/simulation/rng";
import { applyLiveResults, type LiveResult } from "@/src/lib/simulation/standings";
import { expectedGoals } from "@/src/lib/simulation/strength";
import { bestPlayer, matchClock, minuteLabel, stateAt, type MatchClock } from "@/src/lib/simulation/timeline";
import { usePlayback } from "@/src/lib/simulation/usePlayback";
import { cn } from "@/src/lib/ui/cn";
import { LineupPitch } from "@/src/components/simulation/LineupPitch";
import { EventFeed, type FeedEntry } from "./EventFeed";
import { FullTimeSummary } from "./FullTimeSummary";
import { LiveRatings } from "./LiveRatings";
import { LiveScoreboard, type ScoreFlash } from "./LiveScoreboard";
import { LiveStandings } from "./LiveStandings";
import { LiveStatsPanel } from "./LiveStatsPanel";
import { MomentumChart } from "./MomentumChart";
import { Multiplex, type MultiplexCard } from "./Multiplex";
import { PlaybackControls } from "./PlaybackControls";
import { SectionTitle, sideTones, teamCode } from "./shared";
import { WinProbabilityBar } from "./WinProbabilityBar";

export interface LivePlayerSummary {
  name: string;
  rating: number;
  teamName: string;
}

interface LiveSimulationViewProps {
  data: MatchPresentationData;
  lineups: MatchLineups | null;
}

/**
 * Simulateur live : le match est entièrement simulé dans le navigateur à partir
 * d'une graine (rien n'est enregistré), puis rejoué minute par minute.
 */
export function LiveSimulationView({ data, lineups }: LiveSimulationViewProps) {
  // Graine initiale stable par match (identique serveur / client), puis tirée au hasard.
  const [seed, setSeed] = useState(() => 100000 + ((data.match.id * 7919) % 900000));
  const [run, setRun] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  const replay = () => {
    setAutoPlay(true);
    setRun((r) => r + 1);
  };
  const newSimulation = () => {
    setAutoPlay(true);
    setSeed(randomSeed());
    setRun((r) => r + 1);
  };

  return (
    <LiveMatch
      key={`${seed}-${run}`}
      data={data}
      lineups={lineups}
      seed={seed}
      autoPlay={autoPlay}
      onReplay={replay}
      onNewSimulation={newSimulation}
    />
  );
}

type MobileTab = "feed" | "stats" | "players" | "table";

const MOBILE_TABS: { id: MobileTab; label: string }[] = [
  { id: "feed", label: "Fil" },
  { id: "stats", label: "Stats" },
  { id: "players", label: "Joueurs" },
  { id: "table", label: "Classement" },
];

function scoreAt(sim: SimulatedMatch, t: number) {
  const score = { home: 0, away: 0 };
  for (const e of sim.events) {
    if (e.t > t) break;
    if (e.type === "goal" && e.team) score[e.team] += 1;
    if (e.type === "var" && e.varOverturned && e.team) score[e.team] -= 1;
  }
  return score;
}

function clockShortLabel(clock: MatchClock, halfTime: boolean): string {
  if (halfTime) return "MT";
  if (clock.phase === "pre") return "Avant-match";
  if (clock.phase === "full_time") return "Terminé";
  const regulation = clock.phase === "first" ? 45 : 90;
  const minute = clock.mm + 1;
  return minute > regulation ? `${regulation}+${minute - regulation}'` : `${minute}'`;
}

function LiveMatch({
  data,
  lineups,
  seed,
  autoPlay,
  onReplay,
  onNewSimulation,
}: LiveSimulationViewProps & { seed: number; autoPlay: boolean; onReplay: () => void; onNewSimulation: () => void }) {
  const homeName = data.homeStanding?.clubName ?? lineups?.homeTeam ?? data.match.home_team_name;
  const awayName = data.awayStanding?.clubName ?? lineups?.awayTeam ?? data.match.away_team_name;
  const tones = useMemo(() => sideTones(homeName, awayName), [homeName, awayName]);

  const input = useMemo(
    () => ({
      home: buildSimTeam(homeName, data.homeStanding, lineups?.home),
      away: buildSimTeam(awayName, data.awayStanding, lineups?.away),
    }),
    [homeName, awayName, data.homeStanding, data.awayStanding, lineups],
  );
  const match = useMemo(() => runSimulation(input, seed), [input, seed]);

  const multiplex = useMemo(
    () =>
      buildMultiplexFixtures(data.standings, [homeName, awayName], seed).map((fixture, i) => ({
        id: fixture.id,
        homeName: fixture.input.home.name,
        awayName: fixture.input.away.name,
        sim: runSimulation(fixture.input, deriveSeed(seed, i + 1)),
      })),
    [data.standings, homeName, awayName, seed],
  );

  // Buts du multiplex, recalés sur le temps du match principal (pour le fil).
  const multiplexGoals = useMemo(
    () =>
      multiplex.flatMap((mx) => {
        const running = { home: 0, away: 0 };
        return mx.sim.events
          .filter((e) => (e.type === "goal" || (e.type === "var" && e.varOverturned)) && e.team)
          .map((e) => {
            const side = e.team!;
            running[side] += e.type === "goal" ? 1 : -1;
            const scorerTeam = side === "home" ? mx.homeName : mx.awayName;
            const text =
              e.type === "goal"
                ? `But pour ${scorerTeam} ! ${mx.homeName} ${running.home}-${running.away} ${mx.awayName}`
                : `But refusé pour ${scorerTeam} par la VAR. ${mx.homeName} ${running.home}-${running.away} ${mx.awayName}`;
            return { id: `mx-${mx.id}-${e.id}`, fixtureId: mx.id, t: toMainTime(match, mx.sim, e.t), label: minuteLabel(e), text };
          });
      }),
    [multiplex, match],
  );

  const playback = usePlayback({ duration: match.duration, halfTimeAt: match.halfTimeAt, autoPlay });
  const { clock: t, status, started } = playback;

  const state = useMemo(() => stateAt(match, t), [match, t]);
  const previousRatings = useMemo(
    () => new Map(stateAt(match, Math.max(0, t - 10)).players.map((p) => [p.player.id, p.rating])),
    [match, t],
  );
  const clock = matchClock(match, t, started);
  const shortClock = clockShortLabel(clock, status === "half_time");
  const flashWindow = Math.min(1.6 * playback.speed, 8);

  // Tableau d'affichage : bandeau « BUT ! » / « Rouge ! » / « But refusé » juste après l'action.
  const flash = useMemo<ScoreFlash | null>(() => {
    if (status !== "playing" && status !== "half_time") return null;
    const recent = [...match.events]
      .reverse()
      .find((e) => e.t <= t && t - e.t < flashWindow && (e.type === "goal" || e.type === "red" || (e.type === "var" && e.varOverturned)));
    if (!recent || !recent.team) return null;
    const player = [...match.input.home.starters, ...match.input.home.bench, ...match.input.away.starters, ...match.input.away.bench].find(
      (p) => p.id === recent.playerId,
    );
    return {
      event: recent,
      kind: recent.type === "goal" ? "goal" : recent.type === "red" ? "red" : "var_overturned",
      teamName: recent.team === "home" ? homeName : awayName,
      playerName: player?.shortName,
    };
  }, [match, t, status, flashWindow, homeName, awayName]);

  const multiplexCards = useMemo<MultiplexCard[]>(
    () =>
      multiplex.map((mx) => ({
        id: mx.id,
        homeName: mx.homeName,
        awayName: mx.awayName,
        score: started ? scoreAt(mx.sim, syncedTime(match, mx.sim, t)) : { home: 0, away: 0 },
        flash: status === "playing" && multiplexGoals.some((g) => g.fixtureId === mx.id && g.t <= t && t - g.t < flashWindow),
      })),
    [multiplex, multiplexGoals, match, t, started, status, flashWindow],
  );

  const liveRows = useMemo(() => {
    if (!started) return applyLiveResults(data.standings, []);
    const results: LiveResult[] = [
      { home: homeName, away: awayName, homeGoals: state.score.home, awayGoals: state.score.away },
      ...multiplexCards.map((c) => ({ home: c.homeName, away: c.awayName, homeGoals: c.score.home, awayGoals: c.score.away })),
    ];
    return applyLiveResults(data.standings, results);
  }, [data.standings, started, homeName, awayName, state.score, multiplexCards]);

  const feed = useMemo<FeedEntry[]>(() => {
    const own: FeedEntry[] = match.events
      .filter((e) => e.t <= t)
      .map((e: SimEvent) => ({
        kind: "match" as const,
        id: e.id,
        t: e.t,
        event: e,
        teamName: e.team ? (e.team === "home" ? homeName : awayName) : undefined,
      }));
    const others: FeedEntry[] = multiplexGoals
      .filter((g) => g.t <= t)
      .map((g) => ({ kind: "multiplex" as const, id: g.id, t: g.t, label: g.label, text: g.text }));
    return [...own, ...others].sort((a, b) => b.t - a.t);
  }, [match, multiplexGoals, t, homeName, awayName]);

  const [selectedFixture, setSelectedFixture] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("feed");

  // Probabilités de référence : avant le dernier but, sinon avant-match.
  const lastGoal = [...match.events].reverse().find((e) => e.type === "goal" && e.t <= t);
  const reference = lastGoal ? match.frames[Math.max(0, Math.floor(lastGoal.t))].winProbability : match.frames[0].winProbability;
  const markers = match.events.filter((e) => e.t <= t && (e.type === "goal" || e.type === "red"));

  const best = bestPlayer(state);
  const bestSummary: LivePlayerSummary | undefined = best
    ? { name: best.player.shortName, rating: best.rating, teamName: best.side === "home" ? homeName : awayName }
    : undefined;

  const highlighted = selectedFixture
    ? multiplex.filter((m) => m.id === selectedFixture).flatMap((m) => [m.homeName, m.awayName])
    : [];

  // Barre d'espace = lecture / pause (hors champs et boutons).
  const { toggle } = playback;
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code !== "Space") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, [contenteditable='true']")) return;
      e.preventDefault();
      toggle();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  const expected = expectedGoals(input.home.strength, input.away.strength);
  const section = (tab: MobileTab) => cn(mobileTab !== tab && "hidden", "lg:block");

  return (
    <div className="flex w-full flex-col gap-8">
      <LiveScoreboard
        match={match}
        homeName={homeName}
        awayName={awayName}
        state={state}
        clock={clock}
        status={status}
        flash={flash}
        onSeek={playback.seek}
      />

      <div className="space-y-2">
        <PlaybackControls
          playback={playback}
          seed={seed}
          engineLabel={DEFAULT_ENGINE.label}
          onReplay={onReplay}
          onNewSimulation={onNewSimulation}
        />
        <p className="label text-ink/50">
          {DEFAULT_ENGINE.label} · résultats fictifs, en attendant les moteurs du mémoire (Poisson, Markov, ML) · espace = lecture / pause
        </p>
      </div>

      {status === "finished" && (
        <FullTimeSummary
          homeName={homeName}
          awayName={awayName}
          state={state}
          best={bestSummary}
          movements={liveRows.filter((r) => r.clubName === homeName || r.clubName === awayName)}
          seed={seed}
          onReplay={onReplay}
          onNewSimulation={onNewSimulation}
        />
      )}

      {!started && (
        <section className="grid gap-6 border border-ink p-5 md:grid-cols-12 md:p-8" aria-label="Avant-match">
          <div className="md:col-span-5">
            <p className="label text-ink/55">Avant le coup d&apos;envoi</p>
            <p className="display mt-2 text-5xl md:text-6xl">Prêts ?</p>
            <p className="editorial mt-3 text-xl leading-snug text-ink/70">
              Le match est simulé dans ton navigateur à partir de la graine {seed}. Rejoue-le à l&apos;identique ou tire une nouvelle graine.
            </p>
            <button
              type="button"
              onClick={playback.play}
              className="stamp label mt-5 inline-flex items-center gap-3 border border-ink bg-accent px-6 py-4 text-sm text-on-accent"
            >
              Coup d&apos;envoi <span className="arrow">→</span>
            </button>
          </div>
          <div className="space-y-5 md:col-span-7">
            <WinProbabilityBar probability={match.frames[0].winProbability} homeName={homeName} awayName={awayName} tones={tones} />
            <dl className="grid grid-cols-2 border-t border-ink pt-3">
              <div>
                <dt className="label text-ink/55">Buts attendus · {teamCode(homeName)}</dt>
                <dd className="display mt-1 text-4xl tabular">{expected.home.toFixed(2)}</dd>
              </div>
              <div className="text-right">
                <dt className="label text-ink/55">Buts attendus · {teamCode(awayName)}</dt>
                <dd className="display mt-1 text-4xl tabular">{expected.away.toFixed(2)}</dd>
              </div>
            </dl>
            <p className="label text-ink/45">Forces estimées depuis le classement (buts marqués / encaissés par match) + avantage du terrain.</p>
          </div>
        </section>
      )}

      {/* Onglets mobile, avec le score toujours visible */}
      <div className="sticky top-0 z-20 -mx-4 border-y border-ink bg-paper px-4 lg:hidden">
        <p className="label flex justify-between py-1.5 tabular">
          <span>
            {teamCode(homeName)} {state.score.home}-{state.score.away} {teamCode(awayName)}
          </span>
          <span className="text-ink/60">{shortClock}</span>
        </p>
        <div className="flex border-t border-ink/30" role="tablist" aria-label="Sections du simulateur">
          {MOBILE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={mobileTab === tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={cn("label flex-1 py-2", mobileTab === tab.id ? "bg-ink text-paper" : "")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0">
        <div className="flex flex-col gap-10 lg:col-span-8 lg:border-r lg:border-ink lg:pr-8">
          <section className={cn(section("stats"), "space-y-6")}>
            <SectionTitle title="Le rapport de force" aside={started ? shortClock : "Avant-match"} />
            <WinProbabilityBar
              probability={state.frame.winProbability}
              reference={started ? reference : undefined}
              referenceLabel={lastGoal ? `depuis le but de la ${minuteLabel(lastGoal)}` : "depuis le coup d'envoi"}
              homeName={homeName}
              awayName={awayName}
              tones={tones}
            />
            <MomentumChart match={match} clock={t} homeName={homeName} awayName={awayName} tones={tones} markers={markers} />
          </section>

          <section className={cn(section("stats"), "space-y-4")}>
            <SectionTitle title="Statistiques" aside="cumulées" />
            <LiveStatsPanel stats={state.stats} homeName={homeName} awayName={awayName} tones={tones} />
          </section>

          <section className={cn(section("players"), "space-y-4")}>
            <SectionTitle title="Les notes" aside="Performances live" />
            <LiveRatings
              players={state.players}
              previous={previousRatings}
              bestId={best?.player.id}
              homeName={homeName}
              awayName={awayName}
              tones={tones}
              started={started}
            />
          </section>
        </div>

        <div className={cn(section("feed"), "lg:col-span-4 lg:pl-8")}>
          <div className="lg:sticky lg:top-4">
            <EventFeed entries={feed} started={started} />
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-0", mobileTab !== "table" && "hidden lg:grid")}>
        <section className="space-y-4 lg:col-span-7 lg:border-r lg:border-ink lg:pr-8">
          <SectionTitle title="Classement live" aside={data.competitionLabel} />
          <LiveStandings
            rows={liveRows}
            featured={[homeName, awayName]}
            highlighted={highlighted}
            started={started}
            competitionLabel={data.competitionLabel}
          />
        </section>
        <section className="space-y-4 lg:col-span-5 lg:pl-8">
          <SectionTitle title="Multiplex" aside={`Journée ${data.matchday}`} />
          <Multiplex cards={multiplexCards} selected={selectedFixture} onSelect={setSelectedFixture} clockLabel={shortClock} />
        </section>
      </div>

      {!started && lineups && (
        <section className="space-y-6">
          <SectionTitle title="Compositions" aside="utilisées par la simulation" />
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0">
            <div className="lg:border-r lg:border-ink lg:pr-8">
              <LineupPitch lineup={lineups.home} teamName={lineups.homeTeam} />
            </div>
            <div className="lg:pl-8">
              <LineupPitch lineup={lineups.away} teamName={lineups.awayTeam} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
