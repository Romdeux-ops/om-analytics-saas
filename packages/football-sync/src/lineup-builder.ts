import type { RosterPlayer, PlayerPosition } from "./espn-roster";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Formation = "4-3-3" | "4-4-2" | "3-5-2" | "4-2-3-1" | "3-4-3";

export interface LineupSlot {
  /** Joueur assigné */
  player: RosterPlayer;
  /** Rôle dans le XI (ex: "GK", "LB", "CB", "RB", "CM", "LW", "ST", "RW") */
  role: string;
  /** Position x/y sur le terrain (0-100) pour affichage graphique */
  x: number;
  y: number;
}

export interface ProbableLineup {
  /** Formation détectée / par défaut */
  formation: Formation;
  /** 11 titulaires ordonnés par position */
  starters: LineupSlot[];
  /** Remplaçants (typiquement 7-9) */
  substitutes: RosterPlayer[];
}

// ---------------------------------------------------------------------------
// Positions sur le terrain par formation
// ---------------------------------------------------------------------------

interface FormationSlot {
  position: PlayerPosition;
  role: string;
  x: number; // 0 = gauche, 100 = droite
  y: number; // 0 = haut (GK), 100 = bas (attaque)
}

const FORMATION_SLOTS: Record<Formation, FormationSlot[]> = {
  "4-3-3": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "LB",  x: 15, y: 25 },
    { position: "DEF", role: "CB",  x: 38, y: 22 },
    { position: "DEF", role: "CB",  x: 62, y: 22 },
    { position: "DEF", role: "RB",  x: 85, y: 25 },
    { position: "MID", role: "CM",  x: 30, y: 48 },
    { position: "MID", role: "CDM", x: 50, y: 42 },
    { position: "MID", role: "CM",  x: 70, y: 48 },
    { position: "FWD", role: "LW",  x: 20, y: 75 },
    { position: "FWD", role: "ST",  x: 50, y: 80 },
    { position: "FWD", role: "RW",  x: 80, y: 75 },
  ],
  "4-4-2": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "LB",  x: 15, y: 25 },
    { position: "DEF", role: "CB",  x: 38, y: 22 },
    { position: "DEF", role: "CB",  x: 62, y: 22 },
    { position: "DEF", role: "RB",  x: 85, y: 25 },
    { position: "MID", role: "LM",  x: 15, y: 50 },
    { position: "MID", role: "CM",  x: 38, y: 45 },
    { position: "MID", role: "CM",  x: 62, y: 45 },
    { position: "MID", role: "RM",  x: 85, y: 50 },
    { position: "FWD", role: "ST",  x: 38, y: 78 },
    { position: "FWD", role: "ST",  x: 62, y: 78 },
  ],
  "3-5-2": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "CB",  x: 25, y: 22 },
    { position: "DEF", role: "CB",  x: 50, y: 20 },
    { position: "DEF", role: "CB",  x: 75, y: 22 },
    { position: "MID", role: "LWB", x: 10, y: 45 },
    { position: "MID", role: "CM",  x: 32, y: 42 },
    { position: "MID", role: "CDM", x: 50, y: 38 },
    { position: "MID", role: "CM",  x: 68, y: 42 },
    { position: "MID", role: "RWB", x: 90, y: 45 },
    { position: "FWD", role: "ST",  x: 38, y: 78 },
    { position: "FWD", role: "ST",  x: 62, y: 78 },
  ],
  "4-2-3-1": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "LB",  x: 15, y: 25 },
    { position: "DEF", role: "CB",  x: 38, y: 22 },
    { position: "DEF", role: "CB",  x: 62, y: 22 },
    { position: "DEF", role: "RB",  x: 85, y: 25 },
    { position: "MID", role: "CDM", x: 38, y: 40 },
    { position: "MID", role: "CDM", x: 62, y: 40 },
    { position: "MID", role: "LW",  x: 20, y: 60 },
    { position: "MID", role: "CAM", x: 50, y: 58 },
    { position: "MID", role: "RW",  x: 80, y: 60 },
    { position: "FWD", role: "ST",  x: 50, y: 80 },
  ],
  "3-4-3": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "CB",  x: 25, y: 22 },
    { position: "DEF", role: "CB",  x: 50, y: 20 },
    { position: "DEF", role: "CB",  x: 75, y: 22 },
    { position: "MID", role: "LM",  x: 15, y: 48 },
    { position: "MID", role: "CM",  x: 38, y: 42 },
    { position: "MID", role: "CM",  x: 62, y: 42 },
    { position: "MID", role: "RM",  x: 85, y: 48 },
    { position: "FWD", role: "LW",  x: 22, y: 75 },
    { position: "FWD", role: "ST",  x: 50, y: 80 },
    { position: "FWD", role: "RW",  x: 78, y: 75 },
  ],
};

// ---------------------------------------------------------------------------
// Logique de sélection
// ---------------------------------------------------------------------------

/**
 * Score de titularisation : plus un joueur est fréquemment titulaire,
 * plus ce score est élevé. Un titulaire à chaque match = score maximal.
 */
function starterScore(player: RosterPlayer): number {
  // Les starts (titularisations) comptent 2×, les entrées en jeu 1×
  return player.starts * 2 + player.subIns;
}

/**
 * Détecte la formation la plus probable en fonction de la répartition
 * des joueurs les plus utilisés par position.
 */
function detectFormation(players: RosterPlayer[]): Formation {
  const active = players.filter((p) => !p.isInjured && p.appearances > 0);
  const byPos = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  // Compter les joueurs les plus utilisés (top 14)
  const top = active.sort((a, b) => starterScore(b) - starterScore(a)).slice(0, 14);
  for (const p of top) byPos[p.position]++;

  // Heuristique simple : ratio DEF/MID/FWD
  if (byPos.DEF >= 5 && byPos.MID >= 5) return "3-5-2";
  if (byPos.FWD >= 4) return "4-3-3";
  if (byPos.MID >= 6) return "4-2-3-1";
  // Par défaut
  return "4-3-3";
}

/**
 * Construit la composition probable d'un club à partir de son effectif.
 *
 * @param roster    Effectif complet du club (depuis `fetchEspnRoster`)
 * @param formation Formation à utiliser (auto-détectée si non fournie)
 */
export function buildProbableLineup(
  roster: RosterPlayer[],
  formation?: Formation,
): ProbableLineup {
  const selectedFormation = formation ?? detectFormation(roster);
  const slots = FORMATION_SLOTS[selectedFormation];

  // Joueurs disponibles (non blessés), triés par score de titularisation décroissant
  const available = roster
    .filter((p) => !p.isInjured)
    .sort((a, b) => starterScore(b) - starterScore(a));

  const used = new Set<string>();
  const starters: LineupSlot[] = [];

  // Pour chaque slot de la formation, prendre le meilleur joueur disponible à cette position
  for (const slot of slots) {
    const candidate = available.find(
      (p) => p.position === slot.position && !used.has(p.id),
    );

    if (candidate) {
      used.add(candidate.id);
      starters.push({
        player: candidate,
        role: slot.role,
        x: slot.x,
        y: slot.y,
      });
    } else {
      // Fallback : prendre n'importe quel joueur dispo (position adjacente)
      const fallback = available.find((p) => !used.has(p.id));
      if (fallback) {
        used.add(fallback.id);
        starters.push({
          player: fallback,
          role: slot.role,
          x: slot.x,
          y: slot.y,
        });
      }
    }
  }

  // Remplaçants : les meilleurs joueurs restants (max 9)
  const substitutes = available
    .filter((p) => !used.has(p.id))
    .slice(0, 9);

  return {
    formation: selectedFormation,
    starters,
    substitutes,
  };
}

/** Exporte les slots de formation pour le rendu du terrain. */
export function getFormationSlots(formation: Formation): FormationSlot[] {
  return FORMATION_SLOTS[formation] ?? FORMATION_SLOTS["4-3-3"];
}
