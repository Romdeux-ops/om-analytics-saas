"use client";

import { useEffect, useMemo, useState } from "react";

interface MatchCountdownProps {
  targetDate: string | Date;
}

function getTimeLeft(target: Date) {
  const diff = target.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, expired: false };
}

function Tile({ value, label }: { value: number; label: string }) {
  return (
    <div className="count-tile flex min-w-[3.25rem] flex-1 flex-col items-center px-2 py-2.5 md:min-w-[3.75rem]">
      <span
        suppressHydrationWarning
        className="font-tech text-2xl font-black tabular-nums text-white md:text-3xl"
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </span>
    </div>
  );
}

export function MatchCountdown({ targetDate }: MatchCountdownProps) {
  const target = useMemo(() => new Date(targetDate), [targetDate]);
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(target));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (timeLeft.expired) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-cyan-300">
        <span className="pulse-dot" />
        Coup d&apos;envoi imminent
      </p>
    );
  }

  return (
    <div className="flex items-stretch gap-2 md:gap-3" role="timer" aria-live="off">
      <Tile value={timeLeft.days} label="jours" />
      <Tile value={timeLeft.hours} label="heures" />
      <Tile value={timeLeft.minutes} label="min" />
      <Tile value={timeLeft.seconds} label="sec" />
    </div>
  );
}
