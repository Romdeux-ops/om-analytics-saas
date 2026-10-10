"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Search, Shirt, Activity, ShieldAlert, Check } from "lucide-react";
import type { AbsenceReason, PlayerPosition, RosterPlayer } from "@/src/lib/types/lineup";
import { isOmTeam } from "@/src/lib/ui/teams";

interface DeclareAbsenceModalProps {
  open: boolean;
  onClose: () => void;
  teamName: string;
  players: RosterPlayer[];
  alreadyUnavailableIds: Set<string>;
  onDeclare: (player: RosterPlayer, reason: AbsenceReason) => void;
}

export function DeclareAbsenceModal({
  open,
  onClose,
  teamName,
  players,
  alreadyUnavailableIds,
  onDeclare,
}: DeclareAbsenceModalProps) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState<"ALL" | PlayerPosition>("ALL");
  const [selectedReason, setSelectedReason] = useState<AbsenceReason>("injured");

  const isOm = isOmTeam(teamName);

  const availablePlayers = useMemo(() => {
    return players.filter((p) => {
      if (alreadyUnavailableIds.has(p.id)) return false;
      if (filterPos !== "ALL" && p.position !== filterPos) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName =
          p.displayName.toLowerCase().includes(query) ||
          p.shortName.toLowerCase().includes(query);
        const matchesJersey = p.jersey !== null && String(p.jersey) === query;
        if (!matchesName && !matchesJersey) return false;
      }
      return true;
    });
  }, [players, alreadyUnavailableIds, filterPos, search]);

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} titleId="declare-absence-title">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
              <Activity size={16} />
            </span>
            <div>
              <h3 id="declare-absence-title" className="font-tech text-base font-bold uppercase tracking-wider text-white">
                Déclarer une absence · {teamName}
              </h3>
              <p className="text-xs text-slate-400">
                Sélectionnez un joueur et son statut pour le retirer de la feuille de match et du banc.
              </p>
            </div>
          </div>

          {/* Choix du statut : Blessé ou Suspendu */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedReason("injured")}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedReason === "injured"
                  ? "border-amber-400/60 bg-amber-500/20 text-amber-300 ring-2 ring-amber-400/40 shadow-lg"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Activity size={16} className="text-amber-400" />
              <div className="text-left">
                <p className="font-black">🏥 Blessé</p>
                <p className="text-[10px] font-normal lowercase text-slate-400">Indisponible / Soins</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedReason("suspended")}
              className={`flex items-center justify-center gap-2 rounded-2xl border p-3 text-xs font-bold uppercase tracking-wider transition-all ${
                selectedReason === "suspended"
                  ? "border-rose-500/60 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/40 shadow-lg"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <ShieldAlert size={16} className="text-rose-400" />
              <div className="text-left">
                <p className="font-black">🟥 Suspendu</p>
                <p className="text-[10px] font-normal lowercase text-slate-400">Sanction / Cartons</p>
              </div>
            </button>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou numéro..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        {/* Filtres par poste */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setFilterPos(pos)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase transition-colors ${
                filterPos === pos
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {pos === "ALL" ? "Tous" : pos}
            </button>
          ))}
        </div>

        {/* Liste des joueurs */}
        <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
          {availablePlayers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Aucun joueur trouvé correspondant aux critères.
            </div>
          ) : (
            availablePlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  onDeclare(player, selectedReason);
                  onClose();
                }}
                className="group flex w-full items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] p-2 text-left transition-all hover:border-amber-400/40 hover:bg-amber-500/10"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Photo / Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isOm ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-800 text-slate-300"
                  } ring-1 ring-white/10`}>
                    {player.headshotUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.headshotUrl}
                        alt={player.shortName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <Shirt size={14} />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-slate-200 group-hover:text-white">
                      {player.jersey !== null && (
                        <span className="mr-1.5 font-mono text-slate-400">#{player.jersey}</span>
                      )}
                      {player.displayName || player.shortName}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {player.positionLabel || player.position} · {player.appearances} apparitions
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-slate-400">
                    {player.position}
                  </span>
                  <span className="flex items-center gap-1 rounded-lg border border-amber-400/30 bg-amber-500/20 px-2 py-1 text-[10px] font-bold text-amber-300 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
                    <Check size={11} />
                    <span>Déclarer {selectedReason === "injured" ? "blessé" : "suspendu"}</span>
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bouton fermer */}
        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
