"use client";

import { memo } from "react";
import type { UnavailablePlayer } from "@/src/lib/types/lineup";

interface UnavailablePlayersSectionProps {
  unavailable?: UnavailablePlayer[];
  teamName: string;
  isEditable?: boolean;
  onToggleReason?: (playerId: string) => void;
  onRestorePlayer?: (playerId: string) => void;
  onAddClick?: () => void;
  className?: string;
}

/** Les absents, façon feuille de match : noms rayés et motif en toutes lettres. */
export const UnavailablePlayersSection = memo(function UnavailablePlayersSection({
  unavailable = [],
  isEditable = false,
  onToggleReason,
  onRestorePlayer,
  onAddClick,
  className = "",
}: UnavailablePlayersSectionProps) {
  return (
    <div className={`border-t border-ink pt-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="label">Blessés &amp; suspendus ({unavailable.length})</span>

        {isEditable && onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="label border border-ink px-2 py-0.5 hover:bg-ink hover:text-paper"
            title="Ajouter un joueur blessé ou suspendu"
          >
            + Déclarer
          </button>
        )}
      </div>

      <ul className="mt-2">
        {unavailable.length === 0 ? (
          <li className="editorial py-2 text-base text-ink/55">Aucun joueur blessé ou suspendu pour ce match.</li>
        ) : (
          unavailable.map(({ player, reason }) => {
            const isInjured = reason === "injured";
            const label = isInjured ? "Blessé" : "Suspendu";

            return (
              <li key={player.id} className="flex items-center justify-between gap-3 border-b border-ink/15 py-1.5">
                <p className="min-w-0 truncate text-xs">
                  {player.jersey !== null && <span className="mr-1.5 tabular text-ink/50">{player.jersey}</span>}
                  <span className="font-bold uppercase line-through decoration-ink decoration-2">{player.shortName}</span>
                  <span className="label ml-2 text-ink/50">{player.position}</span>
                </p>

                <span className="flex shrink-0 items-center gap-1.5">
                  {isEditable && onToggleReason ? (
                    <button
                      type="button"
                      onClick={() => onToggleReason(player.id)}
                      className={`label border px-1.5 py-0.5 transition-colors ${
                        isInjured ? "border-ink hover:bg-live hover:text-on-accent" : "border-live bg-live text-on-accent hover:bg-ink hover:text-paper"
                      }`}
                      title="Cliquer pour basculer entre Blessé et Suspendu"
                    >
                      {label} ⇄
                    </button>
                  ) : (
                    <span className={`label border px-1.5 py-0.5 ${isInjured ? "border-ink" : "border-live bg-live text-on-accent"}`}>
                      {label}
                    </span>
                  )}

                  {isEditable && onRestorePlayer && (
                    <button
                      type="button"
                      onClick={() => onRestorePlayer(player.id)}
                      className="label border border-ink px-1.5 py-0.5 hover:bg-accent hover:text-on-accent"
                      title="Rétablir ce joueur (le remettre sur le banc)"
                    >
                      Rétablir
                    </button>
                  )}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
});
