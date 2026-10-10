"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Search, Shirt, Check, ArrowRightLeft } from "lucide-react";
import type { LineupSlot, PlayerPosition, RosterPlayer } from "@/src/lib/types/lineup";
import { isOmTeam } from "@/src/lib/ui/teams";

interface PlayerPickerModalProps {
  open: boolean;
  onClose: () => void;
  currentSlot: LineupSlot | null;
  slotIndex: number | null;
  teamName: string;
  allPlayers: RosterPlayer[];
  currentStarters: LineupSlot[];
  onSelectPlayer: (slotIndex: number, player: RosterPlayer) => void;
}

export function PlayerPickerModal({
  open,
  onClose,
  currentSlot,
  slotIndex,
  teamName,
  allPlayers,
  currentStarters,
  onSelectPlayer,
}: PlayerPickerModalProps) {
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState<"ALL" | PlayerPosition>("ALL");

  const isOm = isOmTeam(teamName);

  const starterPlayerIds = useMemo(
    () => new Set(currentStarters.map((s) => s.player.id)),
    [currentStarters],
  );

  const filteredPlayers = useMemo(() => {
    return allPlayers.filter((p) => {
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
  }, [allPlayers, filterPos, search]);

  if (!open || !currentSlot || slotIndex === null) return null;

  return (
    <Modal open={open} onClose={onClose} titleId="player-picker-title">
      <div className="space-y-4">
        {/* En-tête */}
        <div className="border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-300">
              Poste : {currentSlot.role}
            </span>
            <span className="text-xs text-slate-400">· {teamName}</span>
          </div>
          <h2 id="player-picker-title" className="mt-1 font-tech text-xl font-bold uppercase text-white">
            Choisir le joueur titulaire
          </h2>
          <p className="text-xs text-slate-400">
            Titulaire actuel :{" "}
            <span className="font-semibold text-white">
              {currentSlot.player.displayName || currentSlot.player.shortName}
            </span>{" "}
            (#{currentSlot.player.jersey ?? "-"})
          </p>
        </div>

        {/* Barre de recherche & Filtres de positions */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom ou numéro..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
            />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "ALL", label: "Tous" },
              { id: "GK", label: "Gardiens" },
              { id: "DEF", label: "Défenseurs" },
              { id: "MID", label: "Milieux" },
              { id: "FWD", label: "Attaquants" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterPos(f.id as "ALL" | PlayerPosition)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filterPos === f.id
                    ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/40"
                    : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des joueurs */}
        <div className="max-h-72 space-y-1.5 overflow-y-auto no-scrollbar pr-1">
          {filteredPlayers.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              Aucun joueur trouvé correspondant à votre recherche.
            </p>
          ) : (
            filteredPlayers.map((player) => {
              const isCurrent = player.id === currentSlot.player.id;
              const isAlreadyStarter = starterPlayerIds.has(player.id);

              return (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    onSelectPlayer(slotIndex, player);
                    onClose();
                  }}
                  className={`group flex w-full items-center justify-between gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    isCurrent
                      ? "border-cyan-400/50 bg-cyan-500/15 text-white ring-1 ring-cyan-400/30"
                      : "border-white/5 bg-white/[0.02] hover:border-cyan-400/30 hover:bg-white/5 text-slate-300"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {/* Avatar */}
                    <div
                      className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isOm ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30" : "bg-white/10 text-slate-200 ring-1 ring-white/20"
                      }`}
                    >
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
                      {player.jersey !== null && (
                        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[8px] font-bold text-white ring-1 ring-white/20">
                          {player.jersey}
                        </span>
                      )}
                    </div>

                    {/* Nom + position */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-xs font-bold text-white group-hover:text-cyan-300">
                          {player.displayName || player.shortName}
                        </p>
                        {isCurrent && (
                          <span className="flex items-center gap-0.5 rounded bg-cyan-400/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300">
                            <Check size={10} /> En poste
                          </span>
                        )}
                        {!isCurrent && isAlreadyStarter && (
                          <span className="flex items-center gap-0.5 rounded bg-amber-400/10 px-1 py-0.2 text-[9px] font-bold text-amber-300">
                            <ArrowRightLeft size={9} /> Échanger
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {player.positionLabel || player.position} · {player.nationality || "FR"}
                        {player.appearances > 0 && ` · ${player.starts} titularisations`}
                        {(player.goals > 0 || player.assists > 0) &&
                          ` · ${player.goals}⚽ ${player.assists}🅰️`}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs font-bold text-cyan-400 opacity-0 transition-opacity group-hover:opacity-100">
                    Choisir
                  </span>
                </button>
              );
            })
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
