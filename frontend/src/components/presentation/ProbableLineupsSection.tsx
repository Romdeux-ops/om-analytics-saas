"use client";

import { memo, useMemo, useState } from "react";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { LineupPitch, SubstitutesBench } from "@/src/components/simulation/LineupPitch";
import { UnavailablePlayersSection } from "@/src/components/simulation/UnavailablePlayersSection";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { AbsenceReason, Formation, LineupSlot, MatchLineups, ProbableLineup, RosterPlayer } from "@/src/lib/types/lineup";
import { buildProbableLineup } from "@/src/lib/data/lineup";
import { PlayerPickerModal } from "@/src/components/presentation/PlayerPickerModal";
import { DeclareAbsenceModal } from "@/src/components/presentation/DeclareAbsenceModal";
import { saveMatchLineupAction, resetMatchLineupAction } from "@/src/app/actions/match";

const AVAILABLE_FORMATIONS: Formation[] = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "4-2-2-2",
  "3-5-2",
  "3-4-3",
  "5-3-2",
];

interface ProbableLineupsSectionProps {
  lineups: MatchLineups | null;
  homeTeamName: string;
  awayTeamName: string;
  matchId?: number;
  isAdmin?: boolean;
  onLineupsChange?: (updated: MatchLineups) => void;
}

export const ProbableLineupsSection = memo(function ProbableLineupsSection({
  lineups,
  homeTeamName,
  awayTeamName,
  matchId,
  isAdmin = false,
  onLineupsChange,
}: ProbableLineupsSectionProps) {
  const homeShort = shortTeamName(homeTeamName);
  const awayShort = shortTeamName(awayTeamName);

  const [activeTab, setActiveTab] = useState<"both" | "home" | "away">("both");
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingTeam, setEditingTeam] = useState<"home" | "away">("home");

  // Slot currently being edited in modal
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  // Modal de déclaration de blessure / suspension
  const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Équipe en cours d'édition
  const activeEditingLineup: ProbableLineup | null = useMemo(() => {
    if (!lineups) return null;
    return editingTeam === "home" ? lineups.home : lineups.away;
  }, [lineups, editingTeam]);

  // Tous les joueurs du club pour le modal
  const allTeamPlayers: RosterPlayer[] = useMemo(() => {
    if (!activeEditingLineup) return [];
    const starters = activeEditingLineup.starters.map((s) => s.player);
    const bench = activeEditingLineup.substitutes;
    const extra = activeEditingLineup.allSquadPlayers ?? [];
    const unavailable = (activeEditingLineup.unavailable ?? []).map((u) => u.player);

    const map = new Map<string, RosterPlayer>();
    for (const p of [...starters, ...bench, ...extra, ...unavailable]) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    return Array.from(map.values());
  }, [activeEditingLineup]);

  const currentSelectedSlot: LineupSlot | null = useMemo(() => {
    if (selectedSlotIndex === null || !activeEditingLineup) return null;
    return activeEditingLineup.starters[selectedSlotIndex] ?? null;
  }, [selectedSlotIndex, activeEditingLineup]);

  // 1. Changement de formation tactique (ex: 4-3-3 vers 4-2-3-1 ou 4-4-2)
  function handleFormationChange(newFormation: Formation) {
    if (!lineups) return;
    const teamKey = editingTeam;
    const currentTeamLineup = lineups[teamKey];
    if (currentTeamLineup.formation === newFormation) return;

    const rebuilt = buildProbableLineup(allTeamPlayers, newFormation);

    const updatedLineups: MatchLineups = {
      ...lineups,
      [teamKey]: {
        ...currentTeamLineup,
        formation: newFormation,
        starters: rebuilt.starters,
        substitutes: rebuilt.substitutes,
        allSquadPlayers: allTeamPlayers,
      },
    };

    onLineupsChange?.(updatedLineups);
    setIsDirty(true);
  }

  // 2. Choix d'un joueur pour un poste titulaire
  function handleSelectPlayer(slotIndex: number, newPlayer: RosterPlayer) {
    if (!lineups || !activeEditingLineup) return;
    const teamKey = editingTeam;
    const currentStarters = [...activeEditingLineup.starters];
    const currentSubs = [...activeEditingLineup.substitutes];
    const targetSlot = currentStarters[slotIndex];
    if (!targetSlot) return;

    const oldPlayer = targetSlot.player;
    if (oldPlayer.id === newPlayer.id) return;

    // Si le joueur est déjà titulaire à un autre poste -> Échanger les deux postes
    const existingStarterIndex = currentStarters.findIndex((s) => s.player.id === newPlayer.id);

    if (existingStarterIndex !== -1) {
      currentStarters[existingStarterIndex] = {
        ...currentStarters[existingStarterIndex],
        player: oldPlayer,
      };
      currentStarters[slotIndex] = {
        ...currentStarters[slotIndex],
        player: newPlayer,
      };
    } else {
      // Si le joueur vient du banc ou de la réserve -> le remplacer et basculer l'ancien sur le banc
      currentStarters[slotIndex] = {
        ...currentStarters[slotIndex],
        player: newPlayer,
      };

      const subIdx = currentSubs.findIndex((p) => p.id === newPlayer.id);
      if (subIdx !== -1) {
        currentSubs[subIdx] = oldPlayer;
      } else {
        currentSubs.unshift(oldPlayer);
      }
    }

    const updatedLineups: MatchLineups = {
      ...lineups,
      [teamKey]: {
        ...activeEditingLineup,
        starters: currentStarters,
        substitutes: currentSubs,
      },
    };

    onLineupsChange?.(updatedLineups);
    setIsDirty(true);
  }

  // 3. Déclarer un joueur blessé ou suspendu (retiré du banc ou des titulaires)
  function handleMarkUnavailable(
    teamKey: "home" | "away",
    player: RosterPlayer,
    reason: AbsenceReason,
  ) {
    if (!lineups) return;
    const currentTeamLineup = lineups[teamKey];
    const starters = [...currentTeamLineup.starters];
    let subs = [...currentTeamLineup.substitutes];
    const prevUnavailable = currentTeamLineup.unavailable ?? [];

    // Si le joueur est titulaire, on le remplace par le premier remplaçant disponible
    const starterIdx = starters.findIndex((s) => s.player.id === player.id);
    if (starterIdx !== -1) {
      const targetSlot = starters[starterIdx];
      const candidateIdx = subs.findIndex((p) => p.position === targetSlot.player.position);
      const chosenSubIdx = candidateIdx !== -1 ? candidateIdx : (subs.length > 0 ? 0 : -1);

      if (chosenSubIdx !== -1) {
        const replacementPlayer = subs[chosenSubIdx];
        subs = subs.filter((_, idx) => idx !== chosenSubIdx);
        starters[starterIdx] = {
          ...targetSlot,
          player: replacementPlayer,
        };
      }
    } else {
      subs = subs.filter((p) => p.id !== player.id);
    }

    const newUnavailable = prevUnavailable.filter((u) => u.player.id !== player.id);
    newUnavailable.push({ player, reason });

    const updatedLineups: MatchLineups = {
      ...lineups,
      [teamKey]: {
        ...currentTeamLineup,
        starters,
        substitutes: subs,
        unavailable: newUnavailable,
      },
    };

    onLineupsChange?.(updatedLineups);
    setIsDirty(true);
  }

  // 4. Rétablir un joueur (le retirer des indisponibles et le remettre sur le banc)
  function handleRestorePlayer(teamKey: "home" | "away", playerId: string) {
    if (!lineups) return;
    const currentTeamLineup = lineups[teamKey];
    const prevUnavailable = currentTeamLineup.unavailable ?? [];
    const target = prevUnavailable.find((u) => u.player.id === playerId);
    if (!target) return;

    const remainingUnavailable = prevUnavailable.filter((u) => u.player.id !== playerId);
    const updatedSubs = [target.player, ...currentTeamLineup.substitutes];

    const updatedLineups: MatchLineups = {
      ...lineups,
      [teamKey]: {
        ...currentTeamLineup,
        substitutes: updatedSubs,
        unavailable: remainingUnavailable,
      },
    };

    onLineupsChange?.(updatedLineups);
    setIsDirty(true);
  }

  // 5. Basculer entre Blessé et Suspendu
  function handleToggleUnavailableReason(teamKey: "home" | "away", playerId: string) {
    if (!lineups) return;
    const currentTeamLineup = lineups[teamKey];
    const prevUnavailable = currentTeamLineup.unavailable ?? [];

    const updatedUnavailable = prevUnavailable.map((u) => {
      if (u.player.id !== playerId) return u;
      return {
        ...u,
        reason: u.reason === "injured" ? ("suspended" as const) : ("injured" as const),
      };
    });

    const updatedLineups: MatchLineups = {
      ...lineups,
      [teamKey]: {
        ...currentTeamLineup,
        unavailable: updatedUnavailable,
      },
    };

    onLineupsChange?.(updatedLineups);
    setIsDirty(true);
  }

  // 3. Sauvegarde sur le serveur / base de données
  async function handleSaveLineup() {
    if (!lineups || !matchId) return;
    setIsSaving(true);
    setError(null);

    const res = await saveMatchLineupAction(matchId, lineups);
    setIsSaving(false);

    if (!res.ok) {
      setError(res.error);
    } else {
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    }
  }

  // 4. Réinitialisation
  async function handleResetLineup() {
    if (!matchId) return;
    if (!window.confirm("Rétablir les compositions probables calculées automatiquement ?")) return;

    setIsSaving(true);
    setError(null);
    const res = await resetMatchLineupAction(matchId);
    setIsSaving(false);

    if (!res.ok) {
      setError(res.error);
    } else {
      window.location.reload();
    }
  }

  function renderTeam(teamKey: "home" | "away") {
    if (!lineups) return null;
    const lineup = lineups[teamKey];
    const teamName = teamKey === "home" ? lineups.homeTeam : lineups.awayTeam;
    const editing = isEditMode && editingTeam === teamKey;

    return (
      <div className={`space-y-6 ${editing ? "outline-2 outline-offset-8 outline-dashed outline-ink" : ""}`}>
        <p className="label flex items-center justify-between text-ink/60">
          <span>{teamKey === "home" ? "Domicile" : "Extérieur"}</span>
          {editing && <span className="bg-ink px-1.5 py-0.5 text-paper">Édition</span>}
        </p>

        <LineupPitch
          lineup={lineup}
          teamName={teamName}
          isEditable={editing}
          onSlotClick={(idx) => {
            setEditingTeam(teamKey);
            setSelectedSlotIndex(idx);
          }}
        />

        <SubstitutesBench
          substitutes={lineup.substitutes}
          teamName={teamName}
          isEditable={editing}
          onMarkUnavailable={(player, reason) => handleMarkUnavailable(teamKey, player, reason)}
        />

        <UnavailablePlayersSection
          unavailable={lineup.unavailable ?? []}
          teamName={teamName}
          isEditable={editing}
          onToggleReason={(id) => handleToggleUnavailableReason(teamKey, id)}
          onRestorePlayer={(id) => handleRestorePlayer(teamKey, id)}
          onAddClick={() => {
            setEditingTeam(teamKey);
            setIsAbsenceModalOpen(true);
          }}
        />
      </div>
    );
  }

  const segment = (active: boolean) =>
    `label border-r border-ink px-3 py-2 last:border-r-0 transition-colors duration-100 ${
      active ? "bg-ink text-paper" : "hover:bg-accent hover:text-on-accent"
    }`;

  return (
    <section>
      <SectionHeading
        index="05"
        title="Les onze probables"
        subtitle="11 de départ, schémas tactiques et bancs complets"
        action={
          <span className="flex flex-wrap items-center justify-end gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsEditMode(!isEditMode);
                  if (!isEditMode && activeTab === "both") {
                    setActiveTab("home");
                  }
                }}
                className={`border border-ink px-3 py-2 transition-colors ${
                  isEditMode ? "bg-accent text-on-accent" : "hover:bg-ink hover:text-paper"
                }`}
              >
                {isEditMode ? "Mode édition actif" : "Modifier la composition"}
              </button>
            )}

            <span className="flex border border-ink">
              {!isEditMode && (
                <button type="button" onClick={() => setActiveTab("both")} className={segment(activeTab === "both")}>
                  Côte à côte
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("home");
                  setEditingTeam("home");
                }}
                className={segment(activeTab === "home")}
              >
                {homeShort}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("away");
                  setEditingTeam("away");
                }}
                className={segment(activeTab === "away")}
              >
                {awayShort}
              </button>
            </span>
          </span>
        }
      />

      {/* Panneau tactique Staff / Admin */}
      {isAdmin && isEditMode && lineups && (
        <div className="ink-block mb-8 space-y-5 p-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-paper/25 pb-3">
            <div>
              <p className="label text-paper/60">Panneau tactique staff</p>
              <p className="display mt-1 text-4xl">{editingTeam === "home" ? homeTeamName : awayTeamName}</p>
              <p className="mt-1 text-[11px] text-paper/60">
                Changez le schéma tactique ou cliquez sur un joueur du terrain pour le remplacer.
              </p>
            </div>

            <span className="flex border border-paper">
              {(["home", "away"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setEditingTeam(key);
                    setActiveTab(key);
                  }}
                  className={`label border-r border-paper px-3 py-2 last:border-r-0 ${
                    editingTeam === key ? "bg-paper text-ink" : "hover:bg-accent hover:text-on-accent"
                  }`}
                >
                  {key === "home" ? `${homeShort} (Dom)` : `${awayShort} (Ext)`}
                </button>
              ))}
            </span>
          </div>

          <div>
            <p className="label text-paper/60">
              Schéma tactique ({editingTeam === "home" ? homeShort : awayShort})
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVAILABLE_FORMATIONS.map((f) => {
                const isSelected = activeEditingLineup?.formation === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFormationChange(f)}
                    className={`display border px-3 py-1 text-2xl tabular transition-colors ${
                      isSelected
                        ? "border-accent-inverse bg-accent text-on-accent"
                        : "border-paper/40 hover:border-paper hover:bg-paper hover:text-ink"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="label border border-live bg-live px-3 py-2 text-on-accent">{error}</p>}

          {saveSuccess && (
            <p className="label border border-paper px-3 py-2">
              Composition enregistrée avec succès dans le système.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper/25 pt-4">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleResetLineup}
              className="label border-b border-paper/50 pb-0.5 text-paper/70 hover:border-live hover:text-paper disabled:opacity-40"
            >
              Rétablir la composition d&apos;origine
            </button>

            <div className="flex items-center gap-3">
              {isDirty && <span className="label text-accent-inverse">Modifications non enregistrées</span>}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveLineup}
                className="label border border-paper bg-accent px-4 py-2.5 text-on-accent transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_var(--paper)] disabled:opacity-40"
              >
                {isSaving ? "Enregistrement…" : "Enregistrer la composition"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PlayerPickerModal
        open={selectedSlotIndex !== null}
        onClose={() => setSelectedSlotIndex(null)}
        currentSlot={currentSelectedSlot}
        slotIndex={selectedSlotIndex}
        teamName={editingTeam === "home" ? homeTeamName : awayTeamName}
        allPlayers={allTeamPlayers}
        currentStarters={activeEditingLineup?.starters ?? []}
        onSelectPlayer={handleSelectPlayer}
      />

      <DeclareAbsenceModal
        open={isAbsenceModalOpen}
        onClose={() => setIsAbsenceModalOpen(false)}
        teamName={editingTeam === "home" ? homeTeamName : awayTeamName}
        players={allTeamPlayers}
        alreadyUnavailableIds={
          new Set(
            (activeEditingLineup?.unavailable ?? []).map((u) => u.player.id),
          )
        }
        onDeclare={(player, reason) =>
          handleMarkUnavailable(editingTeam, player, reason)
        }
      />

      {!lineups ? (
        <div className="border-y border-ink py-10">
          <p className="display text-4xl text-ink/40">Compositions en cours d&apos;ajustement</p>
          <p className="editorial mt-2 text-lg text-ink/60">
            Les données d&apos;effectif sont synchronisées automatiquement avec les feuilles de match officielles.
          </p>
        </div>
      ) : (
        <div
          className={
            activeTab === "both"
              ? "grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-0 lg:[&>*:first-child]:border-r lg:[&>*:first-child]:border-ink lg:[&>*:first-child]:pr-8 lg:[&>*:last-child]:pl-8"
              : "mx-auto max-w-2xl"
          }
        >
          {(activeTab === "both" || activeTab === "home") && renderTeam("home")}
          {(activeTab === "both" || activeTab === "away") && renderTeam("away")}
        </div>
      )}
    </section>
  );
});
