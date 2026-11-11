"use client";

import { useId, useMemo, useState } from "react";
import type { MinuteFrame, SimEvent, SimulatedMatch } from "@/src/lib/simulation";
import { minuteLabel } from "@/src/lib/simulation/timeline";
import { cn } from "@/src/lib/ui/cn";
import { formatPct, Swatch, teamCode, type SideTones } from "./shared";

type ChartMode = "momentum" | "probability";

interface MomentumChartProps {
  match: SimulatedMatch;
  clock: number;
  homeName: string;
  awayName: string;
  tones: SideTones;
  /** Buts (et cartons rouges) déjà survenus, marqués sur la frise. */
  markers: SimEvent[];
}

const W = 1000;
const H = 220;
const MID = H / 2;
const SMOOTHING = 3;

/** Moyenne glissante centrée : le momentum minute par minute est trop nerveux à lire brut. */
function smooth(frames: MinuteFrame[]): number[] {
  return frames.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (let j = Math.max(1, i - SMOOTHING); j <= Math.min(frames.length - 1, i + SMOOTHING); j++) {
      sum += frames[j].momentum;
      n += 1;
    }
    return n ? sum / n : 0;
  });
}

function minuteAt(match: SimulatedMatch, t: number): string {
  if (t < match.halfTimeAt) return t > 45 ? `45+${Math.ceil(t - 45)}'` : `${Math.max(1, Math.ceil(t))}'`;
  const m = 45 + (t - match.halfTimeAt);
  return m > 90 ? `90+${Math.ceil(m - 90)}'` : `${Math.ceil(m)}'`;
}

/** Empile les repères trop proches (même côté de l'axe) pour qu'ils ne se chevauchent pas. */
function stackMarkers(markers: SimEvent[], duration: number): { event: SimEvent; lane: number }[] {
  const lanes: Record<string, number[]> = { home: [], away: [] };
  return markers.map((event) => {
    const used = lanes[event.team ?? "home"];
    let lane = used.findIndex((lastT) => (event.t - lastT) / duration > 0.08);
    if (lane < 0) lane = used.length;
    used[lane] = event.t;
    return { event, lane };
  });
}

export function MomentumChart({ match, clock, homeName, awayName, tones, markers }: MomentumChartProps) {
  const [mode, setMode] = useState<ChartMode>("momentum");
  const [hover, setHover] = useState<number | null>(null);
  const clipId = useId().replace(/:/g, "");

  const smoothed = useMemo(() => smooth(match.frames), [match.frames]);
  const shown = Math.min(match.frames.length - 1, Math.floor(clock));
  const x = (t: number) => (t / match.duration) * W;

  const momentumPath =
    shown < 1
      ? ""
      : `M0,${MID} L${smoothed
          .slice(0, shown + 1)
          .map((m, i) => `${x(i).toFixed(1)},${(MID - m * (MID - 8)).toFixed(1)}`)
          .join(" L")} L${x(shown).toFixed(1)},${MID} Z`;

  const probLine = (key: "home" | "away") => {
    if (shown < 1) return "";
    return match.frames
      .slice(0, shown + 1)
      .map((f, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${(H - f.winProbability[key] * H).toFixed(1)}`)
      .join(" ");
  };

  const hoverFrame = hover !== null ? match.frames[Math.min(hover, shown)] : null;

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const t = Math.round(((e.clientX - rect.left) / rect.width) * match.duration);
    setHover(t >= 0 && t <= shown ? t : null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex border border-ink" role="group" aria-label="Type de graphique">
          {(
            [
              ["momentum", "Momentum"],
              ["probability", "Probabilités"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={mode === id}
              className={cn("label border-r border-ink px-3 py-1.5 last:border-r-0", mode === id ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent")}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="label flex items-center gap-4 text-ink/60">
          <span className="inline-flex items-center gap-1.5">
            <Swatch className={tones.bg.home} /> {teamCode(homeName)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Swatch className={tones.bg.away} /> {teamCode(awayName)}
          </span>
        </p>
      </div>

      <div
        className="relative mt-3 h-[180px] w-full touch-none select-none md:h-[220px]"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={
          mode === "momentum"
            ? `Momentum du match minute par minute : au-dessus de l'axe ${homeName} domine, en dessous ${awayName}.`
            : `Évolution des probabilités de victoire de ${homeName} et ${awayName}.`
        }
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <clipPath id={`${clipId}-top`}>
              <rect x="0" y="0" width={W} height={MID} />
            </clipPath>
            <clipPath id={`${clipId}-bottom`}>
              <rect x="0" y={MID} width={W} height={MID} />
            </clipPath>
          </defs>

          {/* Grille recessive */}
          {mode === "probability" &&
            [0.25, 0.5, 0.75].map((p) => (
              <line key={p} x1="0" x2={W} y1={H - p * H} y2={H - p * H} stroke="var(--ink)" strokeOpacity="0.12" vectorEffect="non-scaling-stroke" />
            ))}
          <line x1="0" x2={W} y1={mode === "momentum" ? MID : H} y2={mode === "momentum" ? MID : H} stroke="var(--ink)" strokeOpacity="0.5" vectorEffect="non-scaling-stroke" />
          <line x1={x(match.halfTimeAt)} x2={x(match.halfTimeAt)} y1="0" y2={H} stroke="var(--ink)" strokeOpacity="0.3" vectorEffect="non-scaling-stroke" />

          {mode === "momentum" ? (
            <>
              <path d={momentumPath} fill={tones.fill.home} fillOpacity="0.85" clipPath={`url(#${clipId}-top)`} />
              <path d={momentumPath} fill={tones.fill.away} fillOpacity="0.85" clipPath={`url(#${clipId}-bottom)`} />
            </>
          ) : (
            <>
              <path d={probLine("home")} fill="none" stroke={tones.fill.home} strokeWidth="2" vectorEffect="non-scaling-stroke" />
              <path d={probLine("away")} fill="none" stroke={tones.fill.away} strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </>
          )}

          {/* Curseur de lecture */}
          {shown > 0 && shown < match.duration && (
            <line x1={x(clock)} x2={x(clock)} y1="0" y2={H} stroke="var(--live)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          )}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1="0" y2={H} stroke="var(--ink)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {/* Repères de buts / rouges, en HTML pour garder un texte net */}
        {stackMarkers(markers, match.duration).map(({ event: ev, lane }) => {
          const top = ev.team === "home";
          return (
            <span
              key={ev.id}
              className={cn(
                "label absolute -translate-x-1/2 border border-ink px-1 py-px tabular",
                ev.type === "goal" ? "bg-paper text-ink" : "bg-live text-paper",
              )}
              style={{ left: `${(ev.t / match.duration) * 100}%`, [top ? "top" : "bottom"]: `${lane * 22}px` }}
              title={ev.text}
            >
              {ev.type === "goal" ? "⚽" : "■"} {minuteLabel(ev)}
            </span>
          );
        })}

        <span className="label pointer-events-none absolute -bottom-5 text-ink/45" style={{ left: `${(match.halfTimeAt / match.duration) * 100}%`, transform: "translateX(-50%)" }}>
          MT
        </span>

        {hoverFrame && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 z-10 w-44 border border-ink bg-paper p-2 text-[12px] shadow-[3px_3px_0_0_var(--ink)]"
            style={{ left: `${(hover / match.duration) * 100}%`, transform: hover > match.duration * 0.7 ? "translateX(calc(-100% - 8px))" : "translateX(8px)" }}
          >
            <p className="label text-ink/60">{minuteAt(match, hover)}</p>
            {mode === "momentum" ? (
              <p className="mt-1">
                Domination{" "}
                <strong>
                  {teamCode(smoothed[hover] >= 0 ? homeName : awayName)} {Math.round(50 + Math.abs(smoothed[hover]) * 50)} %
                </strong>
              </p>
            ) : null}
            <p className="mt-1 tabular">
              {teamCode(homeName)} {formatPct(hoverFrame.winProbability.home)} · N {formatPct(hoverFrame.winProbability.draw)} · {teamCode(awayName)}{" "}
              {formatPct(hoverFrame.winProbability.away)}
            </p>
          </div>
        )}

        {shown < 1 && (
          <p className="editorial absolute inset-0 flex items-center justify-center text-xl text-ink/40">La courbe se dessine pendant le match.</p>
        )}
      </div>
      <div className="label mt-6 flex justify-between text-ink/45">
        <span>0&apos;</span>
        <span>90&apos;</span>
      </div>
    </div>
  );
}
