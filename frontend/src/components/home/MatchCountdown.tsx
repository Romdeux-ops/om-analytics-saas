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

/** Une palette par chiffre : seule celle qui change bascule. */
function Flap({ digit }: { digit: string }) {
  return (
    <span className="count-tile flex h-14 w-10 items-center justify-center overflow-hidden md:h-20 md:w-14">
      <span key={digit} suppressHydrationWarning className="flap display text-4xl md:text-6xl">
        {digit}
      </span>
    </span>
  );
}

function Tile({ value, label }: { value: number; label: string }) {
  const digits = String(value).padStart(2, "0").split("");
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-[3px]">
        {digits.map((d, i) => (
          <Flap key={i} digit={d} />
        ))}
      </div>
      <span className="label text-ink/60">{label}</span>
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
      <p className="label flex items-center gap-2 text-live-text">
        <span className="pulse-dot text-live" />
        Coup d&apos;envoi imminent
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3 md:gap-4" role="timer" aria-live="off">
      <Tile value={timeLeft.days} label="Jours" />
      <span className="display pt-2 text-4xl text-ink/30 md:pt-4 md:text-5xl" aria-hidden="true">:</span>
      <Tile value={timeLeft.hours} label="Heures" />
      <span className="display pt-2 text-4xl text-ink/30 md:pt-4 md:text-5xl" aria-hidden="true">:</span>
      <Tile value={timeLeft.minutes} label="Min" />
      <span className="display pt-2 text-4xl text-ink/30 md:pt-4 md:text-5xl" aria-hidden="true">:</span>
      <Tile value={timeLeft.seconds} label="Sec" />
    </div>
  );
}
