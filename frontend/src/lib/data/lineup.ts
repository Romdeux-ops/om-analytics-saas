import { unstable_cache } from "next/cache";
import type {
  Formation,
  LineupSlot,
  MatchLineups,
  PlayerPosition,
  ProbableLineup,
  RosterPlayer,
  UnavailablePlayer,
} from "@/src/lib/types/lineup";

// ---------------------------------------------------------------------------
// ESPN Team ID mapping (subset of football-sync/teams.ts)
// ---------------------------------------------------------------------------

const ESPN_TEAM_IDS: Record<string, { id: string; league: string }> = {
  // Ligue 1 2026-2027
  Angers:       { id: "7868", league: "fra.1" },
  Auxerre:      { id: "172",  league: "fra.1" },
  Brest:        { id: "6997", league: "fra.1" },
  "Le Havre":   { id: "3236", league: "fra.1" },
  "Le Mans":    { id: "2697", league: "fra.1" },
  Lens:         { id: "175",  league: "fra.1" },
  Lille:        { id: "166",  league: "fra.1" },
  Lorient:      { id: "273",  league: "fra.1" },
  Lyon:         { id: "167",  league: "fra.1" },
  Marseille:    { id: "176",  league: "fra.1" },
  Monaco:       { id: "174",  league: "fra.1" },
  Nice:         { id: "2502", league: "fra.1" },
  "Paris FC":   { id: "6851", league: "fra.1" },
  "Paris-SG":   { id: "160",  league: "fra.1" },
  Rennes:       { id: "169",  league: "fra.1" },
  Strasbourg:   { id: "180",  league: "fra.1" },
  Toulouse:     { id: "179",  league: "fra.1" },
  Troyes:       { id: "170",  league: "fra.1" },
  // Europa League 2026-2027
  "Beşiktaş":       { id: "194",  league: "uefa.europa" },
  Olympiacos:       { id: "400",  league: "uefa.europa" },
  "Sturm Graz":     { id: "3566", league: "uefa.europa" },
  Leverkusen:       { id: "132",  league: "ger.1" },
  "Levski Sofia":   { id: "2673", league: "uefa.europa" },
  Celta:            { id: "3842", league: "esp.1" },
  Celtic:           { id: "345",  league: "sco.1" },
  Anderlecht:       { id: "2559", league: "bel.1" },
};

const ALIASES: Record<string, string> = {
  "Olympique de Marseille": "Marseille",
  OM: "Marseille",
  OLM: "Marseille",
  MAR: "Marseille",
  "Paris Saint-Germain": "Paris-SG",
  PSG: "Paris-SG",
  "Paris SG": "Paris-SG",
  "Olympique Lyonnais": "Lyon",
  OL: "Lyon",
  LOSC: "Lille",
  "LOSC Lille": "Lille",
  "Stade Rennais": "Rennes",
  "Stade Brestois": "Brest",
  "RC Strasbourg Alsace": "Strasbourg",
  "RC Strasbourg": "Strasbourg",
  "AJ Auxerre": "Auxerre",
  "ESTAC Troyes": "Troyes",
  "ES Troyes AC": "Troyes",
  "Olympiakos": "Olympiacos",
  "Olympiacos Piraeus": "Olympiacos",
  "Olympiacos FC": "Olympiacos",
  "Bayer Leverkusen": "Leverkusen",
  "Bayer 04 Leverkusen": "Leverkusen",
  "Celta Vigo": "Celta",
  "Celta de Vigo": "Celta",
  "RC Celta": "Celta",
  "Angers SCO": "Angers",
  "Le Havre AC": "Le Havre",
  HAC: "Le Havre",
  "Le Mans FC": "Le Mans",
  "RC Lens": "Lens",
  "FC Lorient": "Lorient",
  "AS Monaco": "Monaco",
  "OGC Nice": "Nice",
  "Toulouse FC": "Toulouse",
  "Beşiktaş JK": "Beşiktaş",
  Besiktas: "Beşiktaş",
  "SK Sturm Graz": "Sturm Graz",
  "PFC Levski Sofia": "Levski Sofia",
  "Celtic FC": "Celtic",
  "RSC Anderlecht": "Anderlecht",
};

export function resolveTeamName(name: string): string {
  if (ESPN_TEAM_IDS[name]) return name;
  if (ALIASES[name]) return ALIASES[name];
  const trimmed = name.trim();
  if (ESPN_TEAM_IDS[trimmed]) return trimmed;
  if (ALIASES[trimmed]) return ALIASES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (alias.toLowerCase() === lower) return target;
  }
  for (const canon of Object.keys(ESPN_TEAM_IDS)) {
    if (canon.toLowerCase() === lower || lower.includes(canon.toLowerCase())) return canon;
  }
  return name;
}

// ---------------------------------------------------------------------------
// ESPN Roster Fetching (inline — pas de dépendance vers football-sync)
// ---------------------------------------------------------------------------

const ESPN_BASE = "https://site.web.api.espn.com/apis";

interface EspnStat { name: string; value?: number | null }
interface EspnStatCat { name: string; stats: EspnStat[] }

function espnStatValue(cats: EspnStatCat[] | undefined, catName: string, statName: string): number {
  if (!cats) return 0;
  const cat = cats.find((c) => c.name === catName);
  const stat = cat?.stats.find((s) => s.name === statName);
  return typeof stat?.value === "number" ? stat.value : 0;
}

function normPosition(pos?: { name?: string; displayName?: string }): { position: PlayerPosition; label: string } {
  const name = pos?.name?.toLowerCase() ?? "";
  if (name.includes("goalkeeper") || name.includes("goal")) return { position: "GK", label: pos?.displayName ?? "GK" };
  if (name.includes("defender") || name.includes("back")) return { position: "DEF", label: pos?.displayName ?? "Defender" };
  if (name.includes("forward") || name.includes("striker") || name.includes("winger")) return { position: "FWD", label: pos?.displayName ?? "Forward" };
  return { position: "MID", label: pos?.displayName ?? "Midfielder" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEspnAthlete(athlete: any): RosterPlayer {
  const { position, label } = normPosition(athlete.position);
  const cats = athlete.statistics?.splits?.categories;
  const appearances = espnStatValue(cats, "general", "appearances");
  const subIns = espnStatValue(cats, "general", "subIns");

  return {
    id: athlete.id,
    displayName: athlete.displayName ?? "",
    shortName: athlete.shortName ?? "",
    jersey: athlete.jersey ? Number(athlete.jersey) : null,
    position,
    positionLabel: label,
    age: athlete.age ?? 0,
    nationality: athlete.citizenship ?? "",
    headshotUrl: athlete.headshot?.href ?? null,
    appearances,
    subIns,
    starts: Math.max(0, appearances - subIns),
    goals: espnStatValue(cats, "offensive", "totalGoals"),
    assists: espnStatValue(cats, "offensive", "goalAssists"),
    saves: espnStatValue(cats, "goalKeeping", "saves"),
    isInjured:
      (athlete.injuries?.length ?? 0) > 0 ||
      athlete.status?.type === "injury" ||
      athlete.status?.name?.toLowerCase() === "injured",
  };
}

async function fetchEspnRoster(espnTeamId: string, league: string): Promise<RosterPlayer[]> {
  const url = `${ESPN_BASE}/site/v2/sports/soccer/${league}/teams/${espnTeamId}/roster`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`ESPN roster ${espnTeamId} (${league}) → HTTP ${res.status}`);
  const data = await res.json();
  return (data.athletes ?? []).map(parseEspnAthlete).sort(
    (a: RosterPlayer, b: RosterPlayer) => b.appearances - a.appearances,
  );
}

// ---------------------------------------------------------------------------
// Lineup Builder (inline)
// ---------------------------------------------------------------------------

interface FormationSlot {
  position: PlayerPosition;
  role: string;
  x: number;
  y: number;
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
  "4-2-2-2": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "LB",  x: 15, y: 25 },
    { position: "DEF", role: "CB",  x: 38, y: 22 },
    { position: "DEF", role: "CB",  x: 62, y: 22 },
    { position: "DEF", role: "RB",  x: 85, y: 25 },
    { position: "MID", role: "CDM", x: 35, y: 42 },
    { position: "MID", role: "CDM", x: 65, y: 42 },
    { position: "MID", role: "CAM", x: 25, y: 62 },
    { position: "MID", role: "CAM", x: 75, y: 62 },
    { position: "FWD", role: "ST",  x: 38, y: 80 },
    { position: "FWD", role: "ST",  x: 62, y: 80 },
  ],
  "5-3-2": [
    { position: "GK",  role: "GK",  x: 50, y: 5 },
    { position: "DEF", role: "LWB", x: 12, y: 30 },
    { position: "DEF", role: "CB",  x: 32, y: 22 },
    { position: "DEF", role: "CB",  x: 50, y: 20 },
    { position: "DEF", role: "CB",  x: 68, y: 22 },
    { position: "DEF", role: "RWB", x: 88, y: 30 },
    { position: "MID", role: "CM",  x: 30, y: 50 },
    { position: "MID", role: "CDM", x: 50, y: 45 },
    { position: "MID", role: "CM",  x: 70, y: 50 },
    { position: "FWD", role: "ST",  x: 38, y: 78 },
    { position: "FWD", role: "ST",  x: 62, y: 78 },
  ],
};

export { FORMATION_SLOTS };

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

function starterScore(p: RosterPlayer): number {
  return p.starts * 2 + p.subIns;
}

export function buildProbableLineup(
  roster: RosterPlayer[],
  formation: Formation = "4-3-3",
): ProbableLineup {
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS["4-3-3"];
  const available = roster
    .filter((p) => !p.isInjured)
    .sort((a, b) => starterScore(b) - starterScore(a));

  const used = new Set<string>();
  const starters: (LineupSlot | null)[] = new Array(slots.length).fill(null);

  // Passe 1 : Assignation par rôle spécifique exact (ex: RB pour Weah, ST pour Gouiri, RW pour Harit)
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const candidate = available.find((p) => {
      if (used.has(p.id)) return false;
      const { role, secondary } = getPlayerRole(p);
      return role === slot.role || secondary.includes(slot.role);
    });

    if (candidate) {
      used.add(candidate.id);
      starters[i] = { player: candidate, role: slot.role, x: slot.x, y: slot.y };
    }
  }

  // Passe 2 : Remplir les slots restants avec les joueurs de même ligne générale (DEF, MID, FWD, GK)
  for (let i = 0; i < slots.length; i++) {
    if (!starters[i]) {
      const slot = slots[i];
      const fallback =
        available.find((p) => !used.has(p.id) && p.position === slot.position) ??
        available.find((p) => !used.has(p.id));

      if (fallback) {
        used.add(fallback.id);
        starters[i] = { player: fallback, role: slot.role, x: slot.x, y: slot.y };
      }
    }
  }

  // Remplaçants : les meilleurs restants (max 9)
  const substitutes = available.filter((p) => !used.has(p.id)).slice(0, 9);

  // Joueurs indisponibles (blessés recensés dans l'effectif)
  const unavailable: UnavailablePlayer[] = roster
    .filter((p) => p.isInjured)
    .map((p) => ({ player: p, reason: "injured" as const }));

  return {
    formation,
    starters: starters.filter((s): s is LineupSlot => s !== null),
    substitutes,
    unavailable,
    allSquadPlayers: roster,
  };
}

// ---------------------------------------------------------------------------
// Public API (server-side, cached)
// ---------------------------------------------------------------------------

/**
 * Récupère et construit la composition probable d'un club.
 * Cache 1h via unstable_cache de Next.js.
 */
export async function getProbableLineup(teamName: string): Promise<ProbableLineup> {
  const canonicalName = resolveTeamName(teamName);
  const entry = ESPN_TEAM_IDS[canonicalName];
  if (!entry) {
    throw new Error(`Équipe "${teamName}" (résolue en "${canonicalName}") non trouvée dans ESPN_TEAM_IDS`);
  }

  return unstable_cache(
    async () => {
      const roster = await fetchEspnRoster(entry.id, entry.league);
      return buildProbableLineup(roster);
    },
    [`lineup-${canonicalName}`],
    { revalidate: 3600, tags: ["lineups"] },
  )();
}

/**
 * Récupère les compositions probables des deux équipes d'un match.
 */
export async function getMatchLineups(
  homeTeam: string,
  awayTeam: string,
): Promise<MatchLineups> {
  const [home, away] = await Promise.all([
    getProbableLineup(homeTeam),
    getProbableLineup(awayTeam),
  ]);

  return { home, away, homeTeam, awayTeam };
}
