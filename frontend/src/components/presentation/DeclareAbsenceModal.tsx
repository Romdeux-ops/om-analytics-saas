"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
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
    <Modal open={open} onClose={onClose} titleId="declare-absence-title" className="max-w-lg">
      <div className="space-y-4">
        <div className="border-b border-ink pb-3 pr-8">
          <p className="label text-ink/50">Feuille de match · {teamName}</p>
          <h3 id="declare-absence-title" className="display mt-1 text-4xl">
            Déclarer une absence
          </h3>
          <p className="editorial mt-1 text-base text-ink/60">
            Le joueur sort de l&apos;onze et du banc.
          </p>
        </div>

        <div className="grid grid-cols-2 border border-ink">
          <button
            type="button"
            onClick={() => setSelectedReason("injured")}
            className={`border-r border-ink px-3 py-3 text-left ${
              selectedReason === "injured" ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent"
            }`}
          >
            <p className="label">Blessé</p>
            <p className="mt-1 text-[12px] opacity-70">Indisponible / soins</p>
          </button>
          <button
            type="button"
            onClick={() => setSelectedReason("suspended")}
            className={`px-3 py-3 text-left ${
              selectedReason === "suspended" ? "bg-live text-on-accent" : "hover:bg-live hover:text-on-accent"
            }`}
          >
            <p className="label">Suspendu</p>
            <p className="mt-1 text-[12px] opacity-70">Sanction / cartons</p>
          </button>
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Nom ou numéro…"
          className="field"
          aria-label="Rechercher un joueur"
        />

        <div className="flex flex-wrap border border-ink">
          {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => (
            <button
              key={pos}
              type="button"
              onClick={() => setFilterPos(pos)}
              className={`label flex-1 border-r border-ink px-2 py-1.5 last:border-r-0 ${
                filterPos === pos ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent"
              }`}
            >
              {pos === "ALL" ? "Tous" : pos}
            </button>
          ))}
        </div>

        <div className="no-scrollbar max-h-72 overflow-y-auto border-y border-ink">
          {availablePlayers.length === 0 ? (
            <p className="editorial py-8 text-center text-lg text-ink/55">
              Aucun joueur trouvé.
            </p>
          ) : (
            availablePlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  onDeclare(player, selectedReason);
                  onClose();
                }}
                className="group flex w-full items-center justify-between gap-3 border-b border-ink/15 px-2 py-2.5 text-left last:border-b-0 hover:bg-ink hover:text-paper"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className={`display flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-ink text-lg group-hover:border-paper ${
                      isOm ? "bg-accent text-on-accent" : "bg-paper text-ink"
                    }`}
                  >
                    {player.jersey ?? "–"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold uppercase">
                      {player.displayName || player.shortName}
                    </p>
                    <p className="text-[11px] text-ink/50 group-hover:text-paper/60">
                      {player.positionLabel || player.position} · {player.appearances} apparitions
                    </p>
                  </div>
                </div>
                <span className="label shrink-0">
                  {selectedReason === "injured" ? "Blessé →" : "Suspendu →"}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
