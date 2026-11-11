"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PlaybackStatus = "idle" | "playing" | "paused" | "half_time" | "finished";

export const PLAYBACK_SPEEDS = [1, 2, 4, 10] as const;
export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

/** Durée réelle de la pause automatique à la mi-temps. */
const HALF_TIME_BREAK_MS = 4000;
/** Rafraîchissement de l'état React (le chrono interne reste à 60 i/s). */
const RENDER_INTERVAL_MS = 80;

interface PlaybackOptions {
  duration: number;
  halfTimeAt: number;
  autoPlay?: boolean;
  initialSpeed?: PlaybackSpeed;
}

/**
 * Horloge de lecture d'un match simulé. `clock` avance en minutes de jeu ;
 * x1 = une minute de match par seconde réelle.
 */
export function usePlayback({ duration, halfTimeAt, autoPlay = false, initialSpeed = 2 }: PlaybackOptions) {
  const [clock, setClock] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>(autoPlay ? "playing" : "idle");
  const [speed, setSpeed] = useState<PlaybackSpeed>(initialSpeed);
  const [halfTimeAuto, setHalfTimeAuto] = useState(false);

  const clockRef = useRef(0);
  const speedRef = useRef<PlaybackSpeed>(initialSpeed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Boucle d'animation.
  useEffect(() => {
    if (status !== "playing") return;
    let frame = 0;
    let last = performance.now();
    let lastRender = last;

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const before = clockRef.current;
      let next = before + dt * speedRef.current;

      if (before < halfTimeAt && next >= halfTimeAt) {
        clockRef.current = halfTimeAt;
        setClock(halfTimeAt);
        setHalfTimeAuto(true);
        setStatus("half_time");
        return;
      }
      if (next >= duration) {
        next = duration;
        clockRef.current = next;
        setClock(next);
        setStatus("finished");
        return;
      }

      clockRef.current = next;
      if (now - lastRender >= RENDER_INTERVAL_MS) {
        lastRender = now;
        setClock(next);
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [status, duration, halfTimeAt]);

  // Reprise automatique après la pause de la mi-temps.
  useEffect(() => {
    if (status !== "half_time" || !halfTimeAuto) return;
    const timer = setTimeout(() => setStatus("playing"), HALF_TIME_BREAK_MS);
    return () => clearTimeout(timer);
  }, [status, halfTimeAuto]);

  const seek = useCallback(
    (t: number) => {
      const target = Math.min(duration, Math.max(0, t));
      clockRef.current = target;
      setClock(target);
      return target;
    },
    [duration],
  );

  const play = useCallback(() => {
    if (clockRef.current >= duration) seek(0);
    setStatus("playing");
  }, [duration, seek]);

  const pause = useCallback(() => {
    setHalfTimeAuto(false);
    setStatus((s) => (s === "playing" || s === "half_time" ? "paused" : s));
  }, []);

  const toggle = useCallback(() => {
    if (status === "playing") pause();
    else play();
  }, [status, pause, play]);

  const skipToHalfTime = useCallback(() => {
    seek(halfTimeAt);
    setHalfTimeAuto(false);
    setStatus("half_time");
  }, [seek, halfTimeAt]);

  const skipToEnd = useCallback(() => {
    seek(duration);
    setStatus("finished");
  }, [seek, duration]);

  const restart = useCallback(() => {
    seek(0);
    setStatus("playing");
  }, [seek]);

  return {
    clock,
    duration,
    halfTimeAt,
    status,
    speed,
    started: status !== "idle",
    setSpeed,
    play,
    pause,
    toggle,
    seek,
    skipToHalfTime,
    skipToEnd,
    restart,
  };
}

export type Playback = ReturnType<typeof usePlayback>;
