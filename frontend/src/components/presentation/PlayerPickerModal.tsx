"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
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

const POSITIONS: { id: "ALL" | PlayerPosition; label: string }[] = [
  { id: "ALL", label: "Tous" },
  { id: "GK", label: "Gardiens" },
  { id: "DEF", label: "Défenseurs" },
  { id: "MID", label: "Milieux" },
  { id: "FWD", label: "Attaquants" },
];

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
    <Modal open={open} onClose={onClose} titleId="player-picker-title" className="max-w-lg">
      <div className="space-y-4">
        <div className="border-b border-ink pb-3 pr-8">
          <p className="label text-ink/50">
            Poste {currentSlot.role} · {teamName}
          </p>
          <h2 id="player-picker-title" className="display mt-1 text-4xl">
            Choisir le titulaire
          </h2>
          <p className="mt-1 text-[13px] text-ink/60">
            En poste :{" "}
            <span className="font-semibold text-ink">
              {currentSlot.player.displayName || currentSlot.player.shortName}
            </span>{" "}
            (#{currentSlot.player.jersey ?? "—"})
          </p>
        </div>

        <div className="space-y-2.5">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou numéro…"
            className="field"
            aria-label="Rechercher un joueur"
          />

          <div className="flex flex-wrap border border-ink">
            {POSITIONS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterPos(f.id)}
                className={`label flex-1 border-r border-ink px-2 py-1.5 last:border-r-0 ${
                  filterPos === f.id ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="no-scrollbar max-h-72 overflow-y-auto border-y border-ink">
          {filteredPlayers.length === 0 ? (
            <p className="editorial py-8 text-center text-lg text-ink/55">Aucun joueur trouvé.</p>
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
                  className={`group flex w-full items-center justify-between gap-3 border-b border-ink/15 px-2 py-2.5 text-left last:border-b-0 ${
                    isCurrent ? "bg-accent text-on-accent" : "hover:bg-ink hover:text-paper"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`display flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border text-lg ${
                        isCurrent
                          ? "border-on-accent bg-on-accent text-accent"
                          : isOm
                            ? "border-ink bg-accent text-on-accent group-hover:border-paper"
                            : "border-ink bg-paper text-ink group-hover:border-paper"
                      }`}
                    >
                      {player.jersey ?? "–"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold uppercase">
                        {player.displayName || player.shortName}
                      </p>
                      <p className={`text-[11px] ${isCurrent ? "opacity-80" : "text-ink/50 group-hover:text-paper/60"}`}>
                        {player.positionLabel || player.position}
                        {player.nationality ? ` · ${player.nationality}` : ""}
                        {player.appearances > 0 && ` · ${player.starts} titularisations`}
                        {(player.goals > 0 || player.assists > 0) &&
                          ` · ${player.goals} B / ${player.assists} PD`}
                      </p>
                    </div>
                  </div>

                  <span className="label shrink-0">
                    {isCurrent ? "En poste" : isAlreadyStarter ? "Échanger" : "Choisir →"}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
}
