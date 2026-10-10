"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shirt, ChevronDown, ChevronUp, Pencil, Activity, ShieldAlert } from "lucide-react";
import type { AbsenceReason, LineupSlot, ProbableLineup, RosterPlayer } from "@/src/lib/types/lineup";
export { UnavailablePlayersSection } from "./UnavailablePlayersSection";
import { isOmTeam } from "@/src/lib/ui/teams";

// ---------------------------------------------------------------------------
// Couleurs par équipe
// ---------------------------------------------------------------------------

function teamColor(teamName: string): { bg: string; text: string; ring: string; pitch: string } {
  if (isOmTeam(teamName)) {
    return {
      bg: "bg-cyan-500/20",
      text: "text-cyan-300",
      ring: "ring-cyan-400/40",
      pitch: "from-cyan-950/40 via-cyan-900/20 to-transparent",
    };
  }
  return {
    bg: "bg-white/10",
    text: "text-slate-200",
    ring: "ring-white/20",
    pitch: "from-slate-800/40 via-slate-700/20 to-transparent",
  };
}

// ---------------------------------------------------------------------------
// Composant Joueur sur le terrain
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
  const colors = teamColor(teamName);
  const { player, role, x, y } = slot;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, type: "spring", stiffness: 200 }}
      onClick={() => isEditable && onSlotClick?.(index, slot)}
      className={`absolute flex flex-col items-center gap-0.5 ${
        isEditable ? "cursor-pointer group/player z-20" : ""
      }`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Avatar */}
      <div
        className={`relative flex h-8 w-8 items-center justify-center rounded-full ${colors.bg} ring-2 ${
          isEditable
            ? "ring-amber-400 group-hover/player:scale-125 group-hover/player:ring-cyan-300"
            : colors.ring
        } shadow-lg transition-all duration-200 hover:scale-110 sm:h-10 sm:w-10`}
      >
        {player.headshotUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={player.headshotUrl}
            alt={player.shortName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <Shirt size={16} className={colors.text} />
        )}

        {/* Badge d'édition si mode admin actif */}
        {isEditable && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[8px] font-bold text-slate-950 shadow-md ring-1 ring-white/30 animate-pulse">
            <Pencil size={8} />
          </span>
        )}

        {/* Numéro de maillot */}
        {player.jersey !== null && (
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] font-bold text-white ring-1 ring-white/20 sm:h-5 sm:w-5 sm:text-[9px]">
            {player.jersey}
          </span>
        )}
      </div>

      {/* Nom + rôle */}
      <span className={`max-w-[70px] truncate text-center text-[9px] font-bold leading-none ${
        isEditable ? "text-amber-200 group-hover/player:text-cyan-300" : "text-white"
      } drop-shadow-md sm:max-w-[80px] sm:text-[10px]`}>
        {player.shortName}
      </span>
      <span className="text-[7px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[8px]">
        {role}
      </span>
    </motion.div>
  );
});

// ---------------------------------------------------------------------------
// Terrain de foot (pitch)
// ---------------------------------------------------------------------------

function PitchBackground() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="absolute inset-0 h-full w-full opacity-20"
      preserveAspectRatio="none"
    >
      {/* Contour */}
      <rect x="2" y="2" width="96" height="96" fill="none" stroke="white" strokeWidth="0.5" />
      {/* Ligne médiane */}
      <line x1="2" y1="50" x2="98" y2="50" stroke="white" strokeWidth="0.3" />
      {/* Rond central */}
      <circle cx="50" cy="50" r="10" fill="none" stroke="white" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="0.8" fill="white" />
      {/* Surface de réparation haut */}
      <rect x="28" y="2" width="44" height="16" fill="none" stroke="white" strokeWidth="0.3" />
      <rect x="38" y="2" width="24" height="6" fill="none" stroke="white" strokeWidth="0.3" />
      {/* Surface de réparation bas */}
      <rect x="28" y="82" width="44" height="16" fill="none" stroke="white" strokeWidth="0.3" />
      <rect x="38" y="92" width="24" height="6" fill="none" stroke="white" strokeWidth="0.3" />
      {/* Arcs */}
      <path d="M 38 18 A 10 10 0 0 0 62 18" fill="none" stroke="white" strokeWidth="0.3" />
      <path d="M 38 82 A 10 10 0 0 1 62 82" fill="none" stroke="white" strokeWidth="0.3" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Composant Terrain avec les joueurs
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
  const colors = teamColor(teamName);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`font-tech text-sm font-bold uppercase tracking-wider ${colors.text}`}>
            {teamName}
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {lineup.formation}
          </span>
        </div>
        {isEditable && (
          <span className="text-[10px] font-bold text-amber-300">
            Cliquez sur un joueur pour le remplacer
          </span>
        )}
      </div>

      {/* Terrain */}
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-950/30 via-emerald-900/15 to-emerald-950/30 shadow-inner">
        {/* Gradient d'équipe */}
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${colors.pitch} opacity-40`} />

        {/* Lignes du terrain */}
        <PitchBackground />

        {/* Joueurs */}
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
  const colors = teamColor(teamName);
  const displayed = expanded ? substitutes : substitutes.slice(0, 5);

  return (
    <div className={`rounded-2xl border border-white/5 bg-white/[0.02] p-4 ${className}`}>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Remplaçants ({substitutes.length})
        </span>
        {substitutes.length > 5 && (
          expanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />
        )}
      </button>

      <div className="mt-3 space-y-2">
        <AnimatePresence>
          {displayed.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3"
            >
              {/* Avatar */}
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${colors.bg} ring-1 ${colors.ring}`}>
                {player.headshotUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={player.headshotUrl}
                    alt={player.shortName}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <Shirt size={12} className={colors.text} />
                )}
              </div>

              {/* Infos */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-200">
                  {player.jersey !== null && (
                    <span className="mr-1.5 text-slate-500">#{player.jersey}</span>
                  )}
                  {player.shortName}
                </p>
              </div>

              {/* Position */}
              <span className="shrink-0 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                {player.position}
              </span>

              {/* Stats mini */}
              {(player.goals > 0 || player.assists > 0) && (
                <span className="shrink-0 text-[9px] font-medium text-slate-500">
                  {player.goals > 0 && `${player.goals}⚽`}
                  {player.assists > 0 && ` ${player.assists}🅰️`}
                </span>
              )}

              {/* Actions Admin : Marquer comme blessé ou suspendu */}
              {isEditable && onMarkUnavailable && (
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkUnavailable(player, "injured");
                    }}
                    className="flex items-center gap-0.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-bold text-amber-300 hover:bg-amber-500/25 transition-colors"
                    title="Déclarer blessé et retirer du banc"
                  >
                    <Activity size={9} />
                    <span>Blesser</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkUnavailable(player, "suspended");
                    }}
                    className="flex items-center gap-0.5 rounded-md border border-rose-500/30 bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-300 hover:bg-rose-500/25 transition-colors"
                    title="Déclarer suspendu et retirer du banc"
                  >
                    <ShieldAlert size={9} />
                    <span>Suspendre</span>
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
});
