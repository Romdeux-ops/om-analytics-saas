"use client";

import { memo, useMemo, useState } from "react";
import {
  Users,
  Shirt,
  Shield,
  Layers,
  Pencil,
  Save,
  RotateCcw,
  Check,
  AlertCircle,
} from "lucide-react";
import { LineupPitch, SubstitutesBench } from "@/src/components/simulation/LineupPitch";
import { UnavailablePlayersSection } from "@/src/components/simulation/UnavailablePlayersSection";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { AbsenceReason, Formation, LineupSlot, MatchLineups, ProbableLineup, RosterPlayer, UnavailablePlayer } from "@/src/lib/types/lineup";
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
    let starters = [...currentTeamLineup.starters];
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

  return (
    <section className="space-y-5">
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-400">
            <Users size={16} />
          </span>
          <div>
            <h3 className="font-tech text-base font-bold uppercase tracking-wider text-white">
              Compositions Probables &amp; Remplaçants
            </h3>
            <p className="text-xs text-slate-400">
              11 de départ probables, schémas tactiques et bancs complets
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bouton Staff / Admin */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                setIsEditMode(!isEditMode);
                if (!isEditMode && activeTab === "both") {
                  setActiveTab("home");
                }
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                isEditMode
                  ? "border-amber-400/60 bg-amber-500/20 text-amber-300 shadow-md ring-1 ring-amber-400/40"
                  : "border-amber-400/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              }`}
            >
              <Pencil size={12} />
              <span>{isEditMode ? "Mode Édition Actif" : "Modifier la composition"}</span>
            </button>
          )}

          {/* Sélecteur de vue (Tous / Domicile / Extérieur) */}
          <div className="flex items-center rounded-xl border border-white/10 bg-white/5 p-1 text-xs">
            {!isEditMode && (
              <button
                type="button"
                onClick={() => setActiveTab("both")}
                className={`rounded-lg px-3 py-1 font-bold transition-colors ${
                  activeTab === "both"
                    ? "bg-cyan-500/20 text-cyan-300"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Côte à côte
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTab("home");
                setEditingTeam("home");
              }}
              className={`rounded-lg px-3 py-1 font-bold transition-colors ${
                activeTab === "home"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {homeShort}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("away");
                setEditingTeam("away");
              }}
              className={`rounded-lg px-3 py-1 font-bold transition-colors ${
                activeTab === "away"
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {awayShort}
            </button>
          </div>
        </div>
      </div>

      {/* Barre d'outils tactile Staff / Admin (quand le mode édition est activé) */}
      {isAdmin && isEditMode && lineups && (
        <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-950 p-4 shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-amber-400" />
              <div>
                <p className="font-tech text-sm font-bold uppercase tracking-wider text-white">
                  Panneau Tactique Staff · {editingTeam === "home" ? homeTeamName : awayTeamName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Changez le schéma tactique ou cliquez directement sur n&apos;importe quel joueur sur le terrain pour le remplacer.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Choix de l'équipe à éditer */}
              <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam("home");
                    setActiveTab("home");
                  }}
                  className={`rounded-md px-2.5 py-1 font-bold uppercase transition-colors ${
                    editingTeam === "home" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {homeShort} (Dom)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTeam("away");
                    setActiveTab("away");
                  }}
                  className={`rounded-md px-2.5 py-1 font-bold uppercase transition-colors ${
                    editingTeam === "away" ? "bg-amber-500/20 text-amber-300" : "text-slate-400 hover:text-white"
                  }`}
                >
                  {awayShort} (Ext)
                </button>
              </div>
            </div>
          </div>

          {/* Choix de la formation (4-3-3, 4-2-3-1, 4-4-2, etc.) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Layers size={13} className="text-cyan-400" />
              <span>Schéma tactique &amp; Disposition ({editingTeam === "home" ? homeShort : awayShort}) :</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FORMATIONS.map((f) => {
                const isSelected = activeEditingLineup?.formation === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFormationChange(f)}
                    className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-300"
                        : "border border-white/10 bg-white/5 text-slate-300 hover:border-amber-400/40 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message de succès ou erreur */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-300">
              <Check size={14} className="shrink-0" />
              <span>Composition d&apos;équipe enregistrée avec succès dans le système.</span>
            </div>
          )}

          {/* Actions : Sauvegarder & Réinitialiser */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleResetLineup}
              className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Rétablir composition d&apos;origine</span>
            </button>

            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-[11px] font-semibold text-amber-300">
                  Modifications non enregistrées
                </span>
              )}
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveLineup}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-amber-500/25 transition-transform hover:scale-105 disabled:opacity-50"
              >
                <Save size={13} />
                <span>{isSaving ? "Enregistrement..." : "Enregistrer la composition"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de sélection d'un joueur */}
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

      {/* Modal de déclaration de blessure ou suspension */}
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
        <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-10 text-center text-xs text-slate-500">
          <Shirt size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm font-semibold text-slate-300">
            Compositions en cours d&apos;ajustement tactique
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Les données d&apos;effectif sont synchronisées automatiquement avec les feuilles de match officielles.
          </p>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${
            activeTab === "both"
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1 max-w-2xl mx-auto"
          }`}
        >
          {/* Équipe Domicile */}
          {(activeTab === "both" || activeTab === "home") && (
            <div
              className={`space-y-4 rounded-3xl border bg-white/[0.02] p-5 shadow-xl backdrop-blur-xl transition-all ${
                isEditMode && editingTeam === "home"
                  ? "border-amber-400/50 ring-1 ring-amber-400/30"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-cyan-400">
                    Domicile
                  </span>
                  <span className="font-tech text-base font-black uppercase text-white">
                    {homeShort}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditMode && editingTeam === "home" && (
                    <span className="flex items-center gap-1 rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Pencil size={9} /> Édition
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {lineups.home.formation}
                  </span>
                </div>
              </div>

              {/* Terrain avec les 11 titulaires */}
              <LineupPitch
                lineup={lineups.home}
                teamName={lineups.homeTeam}
                isEditable={isEditMode && editingTeam === "home"}
                onSlotClick={(idx) => {
                  setEditingTeam("home");
                  setSelectedSlotIndex(idx);
                }}
              />

              {/* Banc des remplaçants */}
              <SubstitutesBench
                substitutes={lineups.home.substitutes}
                teamName={lineups.homeTeam}
                isEditable={isEditMode && editingTeam === "home"}
                onMarkUnavailable={(player, reason) =>
                  handleMarkUnavailable("home", player, reason)
                }
              />

              {/* Section Blessés / Suspendus en dessous du banc */}
              <UnavailablePlayersSection
                unavailable={lineups.home.unavailable ?? []}
                teamName={lineups.homeTeam}
                isEditable={isEditMode && editingTeam === "home"}
                onToggleReason={(id) => handleToggleUnavailableReason("home", id)}
                onRestorePlayer={(id) => handleRestorePlayer("home", id)}
                onAddClick={() => {
                  setEditingTeam("home");
                  setIsAbsenceModalOpen(true);
                }}
              />
            </div>
          )}

          {/* Équipe Extérieur */}
          {(activeTab === "both" || activeTab === "away") && (
            <div
              className={`space-y-4 rounded-3xl border bg-white/[0.02] p-5 shadow-xl backdrop-blur-xl transition-all ${
                isEditMode && editingTeam === "away"
                  ? "border-amber-400/50 ring-1 ring-amber-400/30"
                  : "border-white/10"
              }`}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-400">
                    Extérieur
                  </span>
                  <span className="font-tech text-base font-black uppercase text-white">
                    {awayShort}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditMode && editingTeam === "away" && (
                    <span className="flex items-center gap-1 rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Pencil size={9} /> Édition
                    </span>
                  )}
                  <span className="font-mono text-xs font-bold text-slate-400">
                    {lineups.away.formation}
                  </span>
                </div>
              </div>

              {/* Terrain avec les 11 titulaires */}
              <LineupPitch
                lineup={lineups.away}
                teamName={lineups.awayTeam}
                isEditable={isEditMode && editingTeam === "away"}
                onSlotClick={(idx) => {
                  setEditingTeam("away");
                  setSelectedSlotIndex(idx);
                }}
              />

              {/* Banc des remplaçants */}
              <SubstitutesBench
                substitutes={lineups.away.substitutes}
                teamName={lineups.awayTeam}
                isEditable={isEditMode && editingTeam === "away"}
                onMarkUnavailable={(player, reason) =>
                  handleMarkUnavailable("away", player, reason)
                }
              />

              {/* Section Blessés / Suspendus en dessous du banc */}
              <UnavailablePlayersSection
                unavailable={lineups.away.unavailable ?? []}
                teamName={lineups.awayTeam}
                isEditable={isEditMode && editingTeam === "away"}
                onToggleReason={(id) => handleToggleUnavailableReason("away", id)}
                onRestorePlayer={(id) => handleRestorePlayer("away", id)}
                onAddClick={() => {
                  setEditingTeam("away");
                  setIsAbsenceModalOpen(true);
                }}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
});
