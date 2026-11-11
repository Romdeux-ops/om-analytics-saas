import type { Side } from "@/src/lib/simulation";
import type { TeamLiveStats } from "@/src/lib/simulation/timeline";
import { cn } from "@/src/lib/ui/cn";
import { Swatch, teamCode, type SideTones } from "./shared";

interface LiveStatsPanelProps {
  stats: Record<Side, TeamLiveStats>;
  homeName: string;
  awayName: string;
  tones: SideTones;
}

const ROWS: { key: keyof TeamLiveStats; label: string; format?: (v: number) => string }[] = [
  { key: "possession", label: "Possession", format: (v) => `${v} %` },
  { key: "xg", label: "Buts attendus (xG)", format: (v) => v.toFixed(2) },
  { key: "shots", label: "Tirs" },
  { key: "shotsOnTarget", label: "Tirs cadrés" },
  { key: "corners", label: "Corners" },
  { key: "fouls", label: "Fautes" },
  { key: "offsides", label: "Hors-jeu" },
  { key: "yellow", label: "Cartons jaunes" },
  { key: "red", label: "Cartons rouges" },
];

/** Barres en miroir : la part de chaque équipe sur le total de la statistique. */
export function LiveStatsPanel({ stats, homeName, awayName, tones }: LiveStatsPanelProps) {
  return (
    <div>
      <div className="label mb-3 flex justify-between text-ink/60">
        <span className="inline-flex items-center gap-1.5">
          <Swatch className={tones.bg.home} /> {teamCode(homeName)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          {teamCode(awayName)} <Swatch className={tones.bg.away} />
        </span>
      </div>
      <dl className="space-y-3">
        {ROWS.map((row) => {
          const home = stats.home[row.key];
          const away = stats.away[row.key];
          const total = home + away;
          const homeShare = total > 0 ? home / total : 0;
          const awayShare = total > 0 ? away / total : 0;
          const fmt = row.format ?? ((v: number) => String(v));
          return (
            <div key={row.key}>
              <div className="flex items-baseline justify-between text-[13px]">
                <span className={cn("display text-2xl leading-none tabular", home > away && "underline decoration-2 underline-offset-4")}>{fmt(home)}</span>
                <dt className="label text-ink/60">{row.label}</dt>
                <span className={cn("display text-2xl leading-none tabular", away > home && "underline decoration-2 underline-offset-4")}>{fmt(away)}</span>
              </div>
              <dd className="mt-1.5 grid grid-cols-2 gap-[2px]" aria-hidden="true">
                <div className="flex h-1.5 justify-end bg-ink/10">
                  <div className={cn("h-full transition-[width] duration-500", tones.bg.home)} style={{ width: `${homeShare * 100}%` }} />
                </div>
                <div className="h-1.5 bg-ink/10">
                  <div className={cn("h-full transition-[width] duration-500", tones.bg.away)} style={{ width: `${awayShare * 100}%` }} />
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
