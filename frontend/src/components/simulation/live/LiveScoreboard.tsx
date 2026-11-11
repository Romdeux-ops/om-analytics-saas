"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { SimEvent, SimulatedMatch, Side } from "@/src/lib/simulation";
import type { LiveState, MatchClock } from "@/src/lib/simulation/timeline";
import { minuteLabel } from "@/src/lib/simulation/timeline";
import type { PlaybackStatus } from "@/src/lib/simulation/usePlayback";
import { cn } from "@/src/lib/ui/cn";
import { CardIcon, teamCode } from "./shared";

export interface ScoreFlash {
  event: SimEvent;
  kind: "goal" | "var_overturned" | "red";
  teamName: string;
  playerName?: string;
}

interface LiveScoreboardProps {
  match: SimulatedMatch;
  homeName: string;
  awayName: string;
  state: LiveState;
  clock: MatchClock;
  status: PlaybackStatus;
  flash: ScoreFlash | null;
  onSeek: (t: number) => void;
}

export function LiveScoreboard({ match, homeName, awayName, state, clock, status, flash, onSeek }: LiveScoreboardProps) {
  const { score } = state;
  const leader: Side | null = score.home > score.away ? "home" : score.away > score.home ? "away" : null;
  const live = status === "playing";
  const progress = Math.min(100, (state.t / match.duration) * 100);
  const halfMark = (match.halfTimeAt / match.duration) * 100;

  const phaseLabel =
    status === "half_time" ? "Mi-temps" : clock.phase === "full_time" ? "Terminé" : clock.label;

  return (
    <section aria-label="Tableau d'affichage" className="ink-block relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper/20 px-4 py-2">
        <span className="label flex items-center gap-2 text-paper/70">
          {live ? <span className="pulse-dot text-live" aria-hidden="true" /> : <span className="inline-block h-2 w-2 bg-paper/30" aria-hidden="true" />}
          {live ? "En direct · simulation" : "Simulation"}
        </span>
        <span className="label flex items-center gap-3 tabular">
          <span className="text-paper/60">{phaseLabel}</span>
          {clock.phase !== "pre" && clock.phase !== "full_time" && (
            <span className="display text-2xl leading-none tracking-normal" aria-live="off">
              {String(clock.mm).padStart(2, "0")}:{String(clock.ss).padStart(2, "0")}
            </span>
          )}
          {clock.addedTimeAnnounced > 0 && status !== "half_time" && (
            <span className="bg-live px-1.5 py-0.5 text-paper">+{clock.addedTimeAnnounced}</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 px-3 py-6 md:gap-6 md:px-10 md:py-8">
        <TeamSide name={homeName} label="Domicile" align="right" state={state} side="home" />
        <div className="flex items-center gap-2 pt-4 md:gap-3" aria-live="polite" aria-label={`Score ${score.home} à ${score.away}`}>
          <ScoreTile value={score.home} lead={leader === "home"} />
          <span className="display text-4xl text-paper/40">–</span>
          <ScoreTile value={score.away} lead={leader === "away"} />
        </div>
        <TeamSide name={awayName} label="Extérieur" align="left" state={state} side="away" />
      </div>

      {/* Barre de progression : cliquable / pilotable au clavier pour se déplacer dans le match */}
      <div className="relative h-2 bg-paper/10">
        <div className="h-full bg-accent" style={{ width: `${progress}%` }} />
        <span aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-paper/60" style={{ left: `${halfMark}%` }} />
        <input
          type="range"
          min={0}
          max={match.duration}
          step={0.5}
          value={state.t}
          disabled={clock.phase === "pre"}
          onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Position dans le match"
          aria-valuetext={clock.phase === "pre" ? "Avant-match" : `${clock.mm} minutes`}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default"
        />
      </div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key={flash.event.id}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 px-4 text-center",
              flash.kind === "goal" ? "bg-accent text-on-accent" : "bg-live text-paper",
            )}
            role="status"
          >
            <span className="label">{minuteLabel(flash.event)} · {flash.teamName}</span>
            <span className="display text-[clamp(4rem,14vw,9rem)] leading-none">
              {flash.kind === "goal" ? "But !" : flash.kind === "red" ? "Rouge !" : "But refusé"}
            </span>
            {flash.playerName && <span className="editorial text-2xl md:text-3xl">{flash.playerName}</span>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ScoreTile({ value, lead }: { value: number; lead: boolean }) {
  return (
    <span
      className={cn(
        "count-tile display border border-paper/30 px-3 !text-6xl leading-none tabular md:px-5 md:!text-8xl",
        lead && "!bg-accent !text-on-accent",
      )}
    >
      <span key={value} className="flap">
        {value}
      </span>
    </span>
  );
}

function TeamSide({
  name,
  label,
  align,
  state,
  side,
}: {
  name: string;
  label: string;
  align: "left" | "right";
  state: LiveState;
  side: Side;
}) {
  const goals = state.goals.filter((g) => g.side === side);
  const reds = state.players.filter((p) => p.side === side && p.red);
  const redCount = Math.max(reds.length, state.stats[side].red);

  return (
    <div className={cn("min-w-0", align === "right" ? "text-right" : "text-left")}>
      <p className="label text-paper/50">{label}</p>
      <h2 className="display mt-1 truncate text-3xl md:text-6xl">
        <span className="sm:hidden" aria-hidden="true">{teamCode(name)}</span>
        <span className="max-sm:sr-only">{name}</span>
      </h2>
      {redCount > 0 && (
        <p className={cn("mt-2 flex gap-1", align === "right" && "justify-end")} aria-label={`${redCount} carton(s) rouge(s)`}>
          {Array.from({ length: redCount }, (_, i) => (
            <CardIcon key={i} color="red" className="border-paper" />
          ))}
        </p>
      )}
      <ul className="mt-2 space-y-0.5 text-[12px] leading-snug text-paper/80">
        {goals.map((g) => (
          <li key={g.eventId} className={cn("truncate", g.annulled && "text-paper/40 line-through")}>
            {g.playerName} <span className="tabular text-paper/55">{g.label}</span>
            {g.annulled && <span className="sr-only"> (but refusé par la VAR)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
