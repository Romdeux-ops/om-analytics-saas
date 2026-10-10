"use client";

import { memo } from "react";
import { Activity, ShieldAlert, RotateCcw, Plus, Shirt, ArrowRightLeft } from "lucide-react";
import type { AbsenceReason, RosterPlayer, UnavailablePlayer } from "@/src/lib/types/lineup";
import { isOmTeam } from "@/src/lib/ui/teams";

interface UnavailablePlayersSectionProps {
  unavailable?: UnavailablePlayer[];
  teamName: string;
  isEditable?: boolean;
  onToggleReason?: (playerId: string) => void;
  onRestorePlayer?: (playerId: string) => void;
  onAddClick?: () => void;
  className?: string;
}

export const UnavailablePlayersSection = memo(function UnavailablePlayersSection({
  unavailable = [],
  teamName,
  isEditable = false,
  onToggleReason,
  onRestorePlayer,
  onAddClick,
  className = "",
}: UnavailablePlayersSectionProps) {
  const isOm = isOmTeam(teamName);

  return (
    <div className={`rounded-2xl border border-white/5 bg-white/[0.02] p-4 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <Activity size={12} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Blessés &amp; Suspendus ({unavailable.length})
          </span>
        </div>

        {isEditable && onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] font-bold text-rose-300 transition-colors hover:bg-rose-500/20 hover:text-white"
            title="Ajouter un joueur blessé ou suspendu"
          >
            <Plus size={11} />
            <span>Déclarer</span>
          </button>
        )}
      </div>

      {/* Liste des joueurs indisponibles */}
      <div className="mt-3 space-y-2">
        {unavailable.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-3 text-center text-[11px] text-slate-500">
            <span>Aucun joueur blessé ou suspendu pour ce match</span>
          </div>
        ) : (
          unavailable.map(({ player, reason }) => {
            const isInjured = reason === "injured";

            return (
              <div
                key={player.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.015] p-2 transition-colors hover:bg-white/[0.03]"
              >
                {/* Joueur Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 ring-1 ring-white/10">
                    {player.headshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.headshotUrl}
                        alt={player.shortName}
                        className="h-full w-full rounded-full object-cover grayscale opacity-80"
                      />
                    ) : (
                      <Shirt size={12} className="text-slate-400" />
                    )}
                    {/* Badge miniature */}
                    <span
                      className={`absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] ${
                        isInjured ? "bg-amber-500 text-slate-950 font-black" : "bg-rose-600 text-white font-black"
                      }`}
                    >
                      {isInjured ? "✚" : "■"}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-300">
                      {player.jersey !== null && (
                        <span className="mr-1 text-slate-500 font-mono text-[11px]">#{player.jersey}</span>
                      )}
                      {player.shortName}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase font-mono">
                      {player.position}
                    </p>
                  </div>
                </div>

                {/* Statut & Actions Admin */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Badge Statut */}
                  {isEditable && onToggleReason ? (
                    <button
                      type="button"
                      onClick={() => onToggleReason(player.id)}
                      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase transition-all hover:scale-105 ${
                        isInjured
                          ? "border-amber-500/40 bg-amber-500/15 text-amber-300 hover:border-rose-500/50 hover:bg-rose-500/20 hover:text-rose-300"
                          : "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:border-amber-500/50 hover:bg-amber-500/20 hover:text-amber-300"
                      }`}
                      title="Cliquer pour basculer entre Blessé et Suspendu"
                    >
                      {isInjured ? (
                        <>
                          <Activity size={10} className="text-amber-400" />
                          <span>Blessé</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={10} className="text-rose-400" />
                          <span>Suspendu</span>
                        </>
                      )}
                      <ArrowRightLeft size={9} className="opacity-60 ml-0.5" />
                    </button>
                  ) : (
                    <span
                      className={`flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${
                        isInjured
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
                          : "border-rose-500/30 bg-rose-500/10 text-rose-300"
                      }`}
                    >
                      {isInjured ? (
                        <>
                          <Activity size={10} className="text-amber-400" />
                          <span>Blessé</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={10} className="text-rose-400" />
                          <span>Suspendu</span>
                        </>
                      )}
                    </span>
                  )}

                  {/* Bouton pour réintégrer sur le banc */}
                  {isEditable && onRestorePlayer && (
                    <button
                      type="button"
                      onClick={() => onRestorePlayer(player.id)}
                      className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-300 hover:border-emerald-400/40 hover:bg-emerald-500/15 hover:text-emerald-300 transition-colors"
                      title="Rétablir ce joueur (le remettre sur le banc)"
                    >
                      <RotateCcw size={10} />
                      <span className="hidden sm:inline">Rétablir</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
