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
const KNOWN_SPECIFIC_ROLES: Record<string, { role: string; secondary?: string[] }> = {
  // OM (Effectif 2026-2027)
  "timothy weah": { role: "RB", secondary: ["RWB", "RW"] },
  "weah": { role: "RB", secondary: ["RWB", "RW"] },
  "emerson": { role: "LB", secondary: ["LWB"] },
  "emerson palmieri": { role: "LB", secondary: ["LWB"] },
  "ulisses garcia": { role: "LB", secondary: ["LWB"] },
  "nayef aguerd": { role: "CB" },
  "aguerd": { role: "CB" },
  "cj egan-riley": { role: "CB", secondary: ["RB"] },
  "egan-riley": { role: "CB", secondary: ["RB"] },
  "derek cornelius": { role: "CB" },
  "cornelius": { role: "CB" },
  "bamo meïté": { role: "CB" },
  "bamo meite": { role: "CB" },
  "alexi koum": { role: "CB", secondary: ["LB"] },
  "kelyann bezahaf": { role: "RB" },
  "jeffrey de lange": { role: "GK" },
  "de lange": { role: "GK" },
  "théo vermot": { role: "GK" },
  "theo vermot": { role: "GK" },
  "jelle van neck": { role: "GK" },
  "pierre-emile højbjerg": { role: "CDM", secondary: ["CM"] },
  "pierre-emile hojbjerg": { role: "CDM", secondary: ["CM"] },
  "højbjerg": { role: "CDM", secondary: ["CM"] },
  "tochukwu nnadi": { role: "CDM", secondary: ["CM"] },
  "nnadi": { role: "CDM", secondary: ["CM"] },
  "geoffrey kondogbia": { role: "CDM", secondary: ["CM"] },
  "kondogbia": { role: "CDM", secondary: ["CM"] },
  "himad abdelli": { role: "CM", secondary: ["CAM"] },
  "abdelli": { role: "CM", secondary: ["CAM"] },
  "angel gomes": { role: "CM", secondary: ["CAM"] },
  "gomes": { role: "CM", secondary: ["CAM"] },
  "nouhoum kamissoko": { role: "CM" },
  "amine gouiri": { role: "ST", secondary: ["CF"] },
  "gouiri": { role: "ST", secondary: ["CF"] },
  "neal maupay": { role: "ST" },
  "maupay": { role: "ST" },
  "faris moumbagna": { role: "ST" },
  "moumbagna": { role: "ST" },
  "igor paixão": { role: "LW", secondary: ["LM"] },
  "igor paixao": { role: "LW", secondary: ["LM"] },
  "paixão": { role: "LW", secondary: ["LM"] },
  "amine harit": { role: "RW", secondary: ["CAM", "LW"] },
  "harit": { role: "RW", secondary: ["CAM", "LW"] },
  "keyliane abdallah": { role: "RW" },
  "tadjidine mmadi": { role: "LW" },

  // ESTAC Troyes
  "zacharie boucher": { role: "GK" },
  "hillel konaté": { role: "GK" },
  "ismael boura": { role: "LB" },
  "adrien monfray": { role: "CB" },
  "paolo gozzi": { role: "CB" },
  "paolo gozzi iweru": { role: "CB" },
  "michel diaz": { role: "CB" },
  "yvann titi": { role: "RB" },
  "lucas maronnier": { role: "LB" },
  "xavier chavalerin": { role: "CDM", secondary: ["CM"] },
  "chavalerin": { role: "CDM", secondary: ["CM"] },
  "youssouf m'changama": { role: "CM", secondary: ["CAM"] },
  "junior olaitan": { role: "CAM", secondary: ["CM"] },
  "cyriaque irie": { role: "RW" },
  "jafet mpanzu": { role: "LW" },
  "renaud ripart": { role: "ST" },
  "ripart": { role: "ST" },
  "nicolas de préville": { role: "ST" },
  "tawfick issa": { role: "ST" },
  "taïryk arconte": { role: "ST" },
};

function getPlayerRole(player: RosterPlayer): { role: string; secondary: string[] } {
  const normName = player.displayName.toLowerCase().trim();
  const shortNorm = player.shortName.toLowerCase().trim();

  for (const [key, mapping] of Object.entries(KNOWN_SPECIFIC_ROLES)) {
    if (normName === key || shortNorm === key || normName.includes(key)) {
      return { role: mapping.role, secondary: mapping.secondary ?? [] };
    }
  }

  const label = (player.positionLabel || "").toLowerCase();
  if (player.position === "GK") return { role: "GK", secondary: [] };
  if (player.position === "DEF") {
    if (label.includes("left") || label.includes("gauch")) return { role: "LB", secondary: ["LWB"] };
    if (label.includes("right") || label.includes("droit")) return { role: "RB", secondary: ["RWB"] };
    return { role: "CB", secondary: [] };
  }
  if (player.position === "MID") {
    if (label.includes("defensive") || label.includes("défensif")) return { role: "CDM", secondary: ["CM"] };
    if (label.includes("attacking") || label.includes("offensif")) return { role: "CAM", secondary: ["CM"] };
    return { role: "CM", secondary: ["CDM", "CAM"] };
  }
  if (player.position === "FWD") {
    if (label.includes("left") || label.includes("gauch")) return { role: "LW", secondary: ["LM"] };
    if (label.includes("right") || label.includes("droit")) return { role: "RW", secondary: ["RM"] };
    return { role: "ST", secondary: ["CF"] };
  }
  return { role: "CM", secondary: [] };
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
  const starters: (LineupSlot | null)[] = new Array(slots.length).fill(null);

  // Passe 1 : Rôle spécifique exact (ex: RB pour Weah, ST pour Gouiri, RW pour Harit)
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const candidate = available.find((p) => {
      if (used.has(p.id)) return false;
      const { role, secondary } = getPlayerRole(p);
      return role === slot.role || secondary.includes(slot.role);
    });

    if (candidate) {
      used.add(candidate.id);
      starters[i] = {
        player: candidate,
        role: slot.role,
        x: slot.x,
        y: slot.y,
      };
    }
  }

  // Passe 2 : Repli sur les positions générales (DEF, MID, FWD, GK)
  for (let i = 0; i < slots.length; i++) {
    if (!starters[i]) {
      const slot = slots[i];
      const fallback =
        available.find((p) => !used.has(p.id) && p.position === slot.position) ??
        available.find((p) => !used.has(p.id));

      if (fallback) {
        used.add(fallback.id);
        starters[i] = {
          player: fallback,
          role: slot.role,
          x: slot.x,
          y: slot.y,
        };
      }
    }
  }

  // Remplaçants : les meilleurs joueurs restants (max 9)
  const substitutes = available
    .filter((p) => !used.has(p.id))
    .slice(0, 9);

  return {
    formation: selectedFormation,
    starters: starters.filter((s): s is LineupSlot => s !== null),
    substitutes,
  };
}

/** Exporte les slots de formation pour le rendu du terrain. */
export function getFormationSlots(formation: Formation): FormationSlot[] {
  return FORMATION_SLOTS[formation] ?? FORMATION_SLOTS["4-3-3"];
}
