"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { AbsenceReason, LineupSlot, ProbableLineup, RosterPlayer } from "@/src/lib/types/lineup";
export { UnavailablePlayersSection } from "./UnavailablePlayersSection";
import { isOmTeam } from "@/src/lib/ui/teams";
import { cn } from "@/src/lib/ui/cn";

/** Carré-maillot : aplat d'accent pour l'OM, encre pour l'adversaire. */
function shirtClasses(teamName: string) {
  return isOmTeam(teamName) ? "bg-accent text-on-accent" : "bg-ink text-paper";
}

// ---------------------------------------------------------------------------
// Joueur sur le terrain
// ---------------------------------------------------------------------------

const PitchPlayer = memo(function PitchPlayer({
  slot,
  teamName,
  index,
  isEditable = false,
  onSlotClick,
}: {
  slot: LineupSlot;
  teamName: string;
  index: number;
  isEditable?: boolean;
  onSlotClick?: (index: number, slot: LineupSlot) => void;
}) {
  const { player, role, x, y } = slot;

  return (
    <motion.div
      initial={{ opacity: 0, x: "-50%", y: "-40%" }}
      animate={{ opacity: 1, x: "-50%", y: "-50%" }}
      transition={{ delay: index * 0.03, duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
      onClick={() => isEditable && onSlotClick?.(index, slot)}
      className={cn("group/player absolute flex flex-col items-center gap-1", isEditable && "z-20 cursor-pointer")}
      style={{
        left: `${x}%`,
        // y part du but (5) vers l'attaque (80) : on le retourne pour mettre le gardien en bas,
        // sinon la gauche du joueur se retrouve à droite de l'écran.
        top: `${95 - y}%`,
      }}
    >
      <span
        className={cn(
          "relative flex h-8 w-8 items-center justify-center border border-ink font-mono text-xs font-bold tabular transition-transform duration-100 group-hover/player:-translate-y-0.5 sm:h-10 sm:w-10 sm:text-sm",
          shirtClasses(teamName),
          isEditable && "outline-2 outline-offset-2 outline-dashed outline-ink group-hover/player:bg-paper group-hover/player:text-ink",
        )}
      >
        {player.jersey ?? role.slice(0, 2)}
      </span>

      <span className="max-w-[78px] truncate bg-paper px-1 text-center text-[9px] font-bold uppercase leading-tight text-ink sm:text-[10px]">
        {player.shortName}
      </span>
      <span className="text-[8px] font-bold uppercase tracking-wider text-ink/50">{role}</span>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Terrain tracé à la craie
// ---------------------------------------------------------------------------

function PitchBackground() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full text-ink/35"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="0.35" vectorEffect="non-scaling-stroke">
        <rect x="2" y="2" width="96" height="96" />
        <line x1="2" y1="50" x2="98" y2="50" />
        <circle cx="50" cy="50" r="10" />
        <rect x="28" y="2" width="44" height="16" />
        <rect x="38" y="2" width="24" height="6" />
        <rect x="28" y="82" width="44" height="16" />
        <rect x="38" y="92" width="24" height="6" />
        <path d="M 38 18 A 10 10 0 0 0 62 18" />
        <path d="M 38 82 A 10 10 0 0 1 62 82" />
      </g>
      <circle cx="50" cy="50" r="0.8" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Terrain avec les joueurs
// ---------------------------------------------------------------------------

interface LineupPitchProps {
  lineup: ProbableLineup;
  teamName: string;
  className?: string;
  isEditable?: boolean;
  onSlotClick?: (index: number, slot: LineupSlot) => void;
}

export const LineupPitch = memo(function LineupPitch({
  lineup,
  teamName,
  className = "",
  isEditable = false,
  onSlotClick,
}: LineupPitchProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-end justify-between gap-2">
        <span className={cn("display text-4xl", isOmTeam(teamName) ? "text-accent-text" : "text-ink")}>
          {teamName}
        </span>
        <span className="display text-3xl tabular text-ink/40">{lineup.formation}</span>
      </div>
      {isEditable && (
        <p className="label border border-dashed border-ink px-2 py-1">Cliquez sur un joueur pour le remplacer</p>
      )}

      <div className="relative aspect-[3/4] w-full overflow-hidden border border-ink bg-paper-2">
        <PitchBackground />
        <AnimatePresence>
          {lineup.starters.map((slot, i) => (
            <PitchPlayer
              key={slot.player.id || i}
              slot={slot}
              teamName={teamName}
              index={i}
              isEditable={isEditable}
              onSlotClick={onSlotClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Banc des remplaçants
// ---------------------------------------------------------------------------

interface SubstitutesBenchProps {
  substitutes: RosterPlayer[];
  teamName: string;
  className?: string;
  isEditable?: boolean;
  onMarkUnavailable?: (player: RosterPlayer, reason: AbsenceReason) => void;
}

export const SubstitutesBench = memo(function SubstitutesBench({
  substitutes,
  teamName,
  className = "",
  isEditable = false,
  onMarkUnavailable,
}: SubstitutesBenchProps) {
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? substitutes : substitutes.slice(0, 5);

  return (
    <div className={cn("border-t-[6px] border-ink pt-2", className)}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="label flex w-full items-center justify-between text-left"
        aria-expanded={expanded}
      >
        <span>Remplaçants ({substitutes.length})</span>
        {substitutes.length > 5 && <span className="text-ink/60">{expanded ? "Réduire −" : "Tout voir +"}</span>}
      </button>

      <ul className="mt-2">
        <AnimatePresence>
          {displayed.map((player, i) => (
            <motion.li
              key={player.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.02, duration: 0.12 }}
              className="flex items-center gap-3 border-b border-ink/15 py-1.5"
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center border border-ink font-mono text-[10px] font-bold tabular",
                  shirtClasses(teamName),
                )}
              >
                {player.jersey ?? "–"}
              </span>

              <p className="min-w-0 flex-1 truncate text-xs font-bold uppercase">{player.shortName}</p>

              <span className="label shrink-0 text-ink/50">{player.position}</span>

              {(player.goals > 0 || player.assists > 0) && (
                <span className="shrink-0 text-[10px] tabular text-ink/60">
                  {player.goals > 0 && `${player.goals}B`}
                  {player.assists > 0 && ` ${player.assists}PD`}
                </span>
              )}

              {isEditable && onMarkUnavailable && (
                <span className="ml-1 flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkUnavailable(player, "injured");
                    }}
                    className="label border border-ink px-1.5 py-0.5 hover:bg-ink hover:text-paper"
                    title="Déclarer blessé et retirer du banc"
                  >
                    Blesser
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkUnavailable(player, "suspended");
                    }}
                    className="label border border-ink px-1.5 py-0.5 hover:bg-live hover:text-on-accent"
                    title="Déclarer suspendu et retirer du banc"
                  >
                    Suspendre
                  </button>
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
});
