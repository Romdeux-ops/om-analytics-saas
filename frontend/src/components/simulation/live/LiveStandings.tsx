"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { standingsAroundOm } from "@/src/lib/ui/standings-window";
import type { LiveStandingRow } from "@/src/lib/simulation/standings";
import { cn } from "@/src/lib/ui/cn";
import { DiffCell, ZONE_META, ZoneBar } from "@/src/components/classement/standing-cells";

interface LiveStandingsProps {
  rows: LiveStandingRow[];
  /** Clubs du match principal (mis en avant). */
  featured: string[];
  /** Clubs survolés / sélectionnés dans le multiplex. */
  highlighted: string[];
  started: boolean;
  competitionLabel: string;
}

const OUTCOME_STYLE = {
  W: "bg-ink text-paper",
  D: "border border-ink",
  L: "border border-dashed border-ink text-ink/60",
} as const;

export function LiveStandings({ rows, featured, highlighted, started, competitionLabel }: LiveStandingsProps) {
  const [full, setFull] = useState(false);
  const visible = full ? rows : standingsAroundOm(rows, 7);
  const zones = [...new Set(visible.map((r) => r.zone).filter(Boolean))] as NonNullable<LiveStandingRow["zone"]>[];

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="label text-ink/55">
          {started ? "Si les matchs s'arrêtaient maintenant" : `${competitionLabel} · avant la journée`}
        </p>
        <div className="flex border border-ink" role="group" aria-label="Étendue du classement">
          {(
            [
              [false, "Autour de l'OM"],
              [true, "Complet"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFull(value)}
              aria-pressed={full === value}
              className={cn("label border-r border-ink px-2.5 py-1 last:border-r-0", full === value ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div role="table" aria-label="Classement en direct" className="border-t border-ink">
        <div role="row" className="label grid grid-cols-[6px_2rem_2.25rem_1fr_3.25rem_2.5rem_3.5rem] items-center gap-2 border-b border-ink py-1.5 text-ink/55">
          <span role="columnheader"><span className="sr-only">Zone</span></span>
          <span role="columnheader" className="text-right">#</span>
          <span role="columnheader"><span className="sr-only">Évolution</span></span>
          <span role="columnheader">Club</span>
          <span role="columnheader" className="text-center">Live</span>
          <span role="columnheader" className="text-center">Diff</span>
          <span role="columnheader" className="text-right">Pts</span>
        </div>
        {visible.map((row) => {
          const isFeatured = featured.includes(row.clubName);
          const isHighlighted = highlighted.includes(row.clubName);
          return (
            <motion.div
              key={row.clubName}
              layout
              transition={{ type: "spring", stiffness: 380, damping: 34 }}
              role="row"
              className={cn(
                "grid grid-cols-[6px_2rem_2.25rem_1fr_3.25rem_2.5rem_3.5rem] items-center gap-2 border-b border-ink/20 py-2",
                row.isOm && "om-highlight",
                !row.isOm && isHighlighted && "bg-ink/10",
              )}
            >
              <ZoneBar zone={row.zone} />
              <span role="cell" className="display text-right text-2xl leading-none tabular">{row.rank}</span>
              <span role="cell" className="label tabular">
                {row.rankDelta > 0 ? `▲${row.rankDelta}` : row.rankDelta < 0 ? `▼${-row.rankDelta}` : <span className="opacity-40">=</span>}
              </span>
              <span role="cell" className="flex min-w-0 items-center gap-2">
                <span className={cn("truncate text-[13px] uppercase", row.isOm ? "font-bold" : "font-medium")}>{row.clubName}</span>
                {isFeatured && started && <span className="pulse-dot shrink-0 text-live" aria-label="en direct" />}
              </span>
              <span role="cell" className="flex justify-center">
                {row.live ? (
                  <span className={cn("label px-1.5 py-0.5 tabular", OUTCOME_STYLE[row.live.outcome])} title={`contre ${row.live.opponent}`}>
                    {row.live.goalsFor}-{row.live.goalsAgainst}
                  </span>
                ) : (
                  <span className="opacity-30">·</span>
                )}
              </span>
              <DiffCell diff={row.goalsFor - row.goalsAgainst} />
              <span role="cell" className="display text-right text-2xl leading-none tabular">
                {row.pointsDelta > 0 && <span className="label mr-1 align-middle opacity-70">+{row.pointsDelta}</span>}
                {row.points}
              </span>
            </motion.div>
          );
        })}
      </div>

      {zones.length > 0 && (
        <ul className="label mt-3 flex flex-wrap gap-x-4 gap-y-1 text-ink/55">
          {zones.map((zone) => (
            <li key={zone} className="inline-flex items-center gap-1.5">
              <ZoneBar zone={zone} className="h-3" /> {ZONE_META[zone].label}
            </li>
          ))}
          <li>Score live : plein = victoire, contour = nul, pointillé = défaite</li>
        </ul>
      )}
      {!full && rows.length > 7 && (
        <p className="label mt-2 text-ink/45">Fenêtre de 7 clubs autour de l&apos;OM · {rows.length} clubs au total</p>
      )}
    </div>
  );
}
