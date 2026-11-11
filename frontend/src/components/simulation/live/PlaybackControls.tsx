"use client";

import { useState } from "react";
import { Check, Copy, FastForward, Pause, Play, RotateCcw, Shuffle, SkipForward } from "lucide-react";
import { PLAYBACK_SPEEDS, type Playback } from "@/src/lib/simulation/usePlayback";
import { cn } from "@/src/lib/ui/cn";

interface PlaybackControlsProps {
  playback: Playback;
  seed: number;
  engineLabel: string;
  onReplay: () => void;
  onNewSimulation: () => void;
}

const controlClass =
  "pressable label inline-flex items-center gap-2 border border-ink px-3 py-2 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-ink";

export function PlaybackControls({ playback, seed, engineLabel, onReplay, onNewSimulation }: PlaybackControlsProps) {
  const { status, speed } = playback;
  const [copied, setCopied] = useState(false);
  const playing = status === "playing";
  const finished = status === "finished";

  const primaryLabel =
    status === "idle"
      ? "Coup d'envoi"
      : playing
        ? "Pause"
        : status === "half_time"
          ? "Reprendre"
          : finished
            ? "Revoir"
            : "Reprendre";

  async function copySeed() {
    try {
      await navigator.clipboard.writeText(String(seed));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Presse-papiers indisponible : la graine reste lisible à l'écran.
    }
  }

  return (
    <div className="flex flex-col gap-3 border-b border-ink pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={finished ? onReplay : playback.toggle}
          className="stamp label inline-flex items-center gap-2 border border-ink bg-accent px-5 py-2.5 text-on-accent"
          aria-keyshortcuts="Space"
        >
          {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
          {primaryLabel}
        </button>

        <div className="flex border border-ink" role="group" aria-label="Vitesse de lecture">
          {PLAYBACK_SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => playback.setSpeed(s)}
              aria-pressed={speed === s}
              className={cn(
                "label tabular border-r border-ink px-3 py-2 last:border-r-0",
                speed === s ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent",
              )}
            >
              ×{s}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={playback.skipToHalfTime}
          disabled={status === "idle" || playback.clock >= playback.halfTimeAt}
          className={controlClass}
        >
          <SkipForward size={13} aria-hidden="true" /> Mi-temps
        </button>
        <button type="button" onClick={playback.skipToEnd} disabled={finished} className={controlClass}>
          <FastForward size={13} aria-hidden="true" /> Fin du match
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={onReplay} disabled={status === "idle"} className={controlClass} title="Rejoue exactement le même match (même graine)">
          <RotateCcw size={13} aria-hidden="true" /> Rejouer
        </button>
        <button type="button" onClick={onNewSimulation} className={controlClass} title="Tire une nouvelle graine : un autre match">
          <Shuffle size={13} aria-hidden="true" /> Nouvelle simulation
        </button>
        <button
          type="button"
          onClick={copySeed}
          className="label inline-flex items-center gap-2 border border-dashed border-ink px-3 py-2 text-ink/70 hover:text-ink"
          title={`${engineLabel} — copier la graine pour reproduire ce match`}
        >
          Graine <span className="tabular text-ink">{seed}</span>
          {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
          <span className="sr-only" aria-live="polite">{copied ? "Graine copiée" : ""}</span>
        </button>
      </div>
    </div>
  );
}
