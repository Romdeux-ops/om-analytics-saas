import type { MinuteFrame } from "@/src/lib/simulation";
import { cn } from "@/src/lib/ui/cn";
import { formatPct, Swatch, teamCode, type SideTones } from "./shared";

interface WinProbabilityBarProps {
  probability: MinuteFrame["winProbability"];
  /** Probabilités de référence (avant-match ou avant le dernier but) pour afficher la variation. */
  reference?: MinuteFrame["winProbability"];
  referenceLabel?: string;
  homeName: string;
  awayName: string;
  tones: SideTones;
}

/**
 * Barre segmentée 1/N/2 : les trois issues somment à 100 %, chaque segment est
 * nommé et chiffré sous la barre (l'identité ne repose jamais sur la couleur seule).
 */
export function WinProbabilityBar({ probability, reference, referenceLabel, homeName, awayName, tones }: WinProbabilityBarProps) {
  const segments = [
    { key: "home" as const, label: teamCode(homeName), value: probability.home, bg: tones.bg.home },
    { key: "draw" as const, label: "Nul", value: probability.draw, bg: "bg-ink/20" },
    { key: "away" as const, label: teamCode(awayName), value: probability.away, bg: tones.bg.away },
  ];

  return (
    <div>
      <div
        className="flex h-9 w-full gap-[2px] bg-paper"
        role="img"
        aria-label={`Probabilités : ${homeName} ${formatPct(probability.home)}, nul ${formatPct(probability.draw)}, ${awayName} ${formatPct(probability.away)}`}
      >
        {segments.map((s) => (
          <div
            key={s.key}
            className={cn("h-full transition-[flex-grow] duration-500 ease-out", s.bg)}
            style={{ flexGrow: Math.max(s.value, 0.005), flexBasis: 0 }}
          />
        ))}
      </div>
      <dl className="mt-2 grid grid-cols-3 text-[12px]">
        {segments.map((s, i) => {
          const delta = reference ? Math.round((s.value - reference[s.key]) * 100) : 0;
          return (
            <div key={s.key} className={cn(i === 1 && "text-center", i === 2 && "text-right")}>
              <dt className={cn("label inline-flex items-center gap-1.5 text-ink/60", i === 2 && "flex-row-reverse")}>
                {s.key !== "draw" && <Swatch className={s.bg} />}
                {s.label}
              </dt>
              <dd className="display mt-0.5 text-3xl leading-none tabular">{formatPct(s.value)}</dd>
              {reference && delta !== 0 && (
                <dd className="label mt-1 tabular text-ink/55">
                  {delta > 0 ? "▲" : "▼"} {delta > 0 ? "+" : ""}
                  {delta} pts
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {reference && referenceLabel && <p className="label mt-2 text-ink/45">Variation {referenceLabel}</p>}
    </div>
  );
}
