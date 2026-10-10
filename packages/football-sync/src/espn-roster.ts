import { ESPN_TEAM_IDS, canonicalTeamName } from "./teams";

/**
 * API JSON publique ESPN — endpoint roster / squad.
 * Retourne l'effectif complet d'un club avec stats saison.
 */
const BASE_URL = "https://site.web.api.espn.com/apis";

// ---------------------------------------------------------------------------
// Types bruts renvoyés par ESPN
// ---------------------------------------------------------------------------

interface EspnStatEntry {
  name: string;
  value?: number | null;
}

interface EspnStatCategory {
  name: string;
  stats: EspnStatEntry[];
}

interface EspnPosition {
  id: string;
  name: string;
  displayName: string;
  abbreviation: string;
}

interface EspnInjury {
  type?: { description?: string };
  status?: string;
}

interface EspnAthlete {
  id: string;
  displayName: string;
  shortName: string;
  jersey?: string;
  age?: number;
  citizenship?: string;
  position?: EspnPosition;
  headshot?: { href: string; alt?: string };
  status?: { id: string; name: string; type: string };
  injuries?: EspnInjury[];
  statistics?: {
    splits?: {
      categories?: EspnStatCategory[];
    };
  };
}

interface EspnRosterResponse {
  timestamp?: string;
  status?: string;
  season?: { year: number; displayName: string };
  athletes?: EspnAthlete[];
}

// ---------------------------------------------------------------------------
// Types normalisés exportés
// ---------------------------------------------------------------------------

export type PlayerPosition = "GK" | "DEF" | "MID" | "FWD";

export interface RosterPlayer {
  /** ID ESPN du joueur */
  id: string;
  /** Nom affiché (ex: "Amine Harit") */
  displayName: string;
  /** Nom court (ex: "A. Harit") */
  shortName: string;
  /** Numéro de maillot (null si inconnu) */
  jersey: number | null;
  /** Position normalisée */
  position: PlayerPosition;
  /** Libellé de position ESPN (ex: "Midfielder") */
  positionLabel: string;
  /** Âge du joueur */
  age: number;
  /** Nationalité */
  nationality: string;
  /** URL de la photo (headshot ESPN) */
  headshotUrl: string | null;
  /** Nombre de matchs joués cette saison */
  appearances: number;
  /** Nombre de matchs en tant que remplaçant entrant */
  subIns: number;
  /** Nombre de titularisations (= appearances - subIns) */
  starts: number;
  /** Buts marqués */
  goals: number;
  /** Passes décisives */
  assists: number;
  /** Arrêts (GK uniquement) */
  saves: number;
  /** Blessé actuellement */
  isInjured: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normPosition(pos?: EspnPosition): { position: PlayerPosition; label: string } {
  if (!pos) return { position: "MID", label: "Midfielder" };
  const name = pos.name?.toLowerCase() ?? "";
  if (name.includes("goalkeeper") || name.includes("goal")) {
    return { position: "GK", label: pos.displayName };
  }
  if (name.includes("defender") || name.includes("back")) {
    return { position: "DEF", label: pos.displayName };
  }
  if (name.includes("forward") || name.includes("striker") || name.includes("winger")) {
    return { position: "FWD", label: pos.displayName };
  }
  return { position: "MID", label: pos.displayName };
}

function statValue(categories: EspnStatCategory[] | undefined, catName: string, statName: string): number {
  if (!categories) return 0;
  const cat = categories.find((c) => c.name === catName);
  if (!cat) return 0;
  const stat = cat.stats.find((s) => s.name === statName);
  return typeof stat?.value === "number" ? stat.value : 0;
}

function parseAthlete(athlete: EspnAthlete): RosterPlayer {
  const { position, label } = normPosition(athlete.position);
  const cats = athlete.statistics?.splits?.categories;
  const appearances = statValue(cats, "general", "appearances");
  const subIns = statValue(cats, "general", "subIns");

  return {
    id: athlete.id,
    displayName: athlete.displayName,
    shortName: athlete.shortName,
    jersey: athlete.jersey ? Number(athlete.jersey) : null,
    position,
    positionLabel: label,
    age: athlete.age ?? 0,
    nationality: athlete.citizenship ?? "",
    headshotUrl: athlete.headshot?.href ?? null,
    appearances,
    subIns,
    starts: Math.max(0, appearances - subIns),
    goals: statValue(cats, "offensive", "totalGoals"),
    assists: statValue(cats, "offensive", "goalAssists"),
    saves: statValue(cats, "goalKeeping", "saves"),
    isInjured:
      (athlete.injuries?.length ?? 0) > 0 ||
      athlete.status?.type === "injury" ||
      athlete.status?.name?.toLowerCase() === "injured",
  };
}

// ---------------------------------------------------------------------------
// Fonctions exportées
// ---------------------------------------------------------------------------

/**
 * Récupère l'effectif complet d'une équipe ESPN.
 * @param espnTeamId ID ESPN de l'équipe (ex: "176" pour Marseille)
 * @param league     Slug ESPN de la ligue (ex: "fra.1")
 */
export async function fetchEspnRoster(
  espnTeamId: string,
  league = "fra.1",
): Promise<RosterPlayer[]> {
  const url = `${BASE_URL}/site/v2/sports/soccer/${league}/teams/${espnTeamId}/roster`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`ESPN roster ${espnTeamId} (${league}) → HTTP ${res.status}`);
  }

  const data = (await res.json()) as EspnRosterResponse;
  const athletes = data.athletes ?? [];

  return athletes
    .map(parseAthlete)
    .sort((a, b) => b.appearances - a.appearances);
}

/**
 * Récupère l'effectif d'un club par son nom canonique.
 * Résout automatiquement l'ID ESPN via le mapping `ESPN_TEAM_IDS`.
 * @throws si le club n'est pas dans le mapping
 */
export async function fetchRosterByTeamName(teamName: string): Promise<RosterPlayer[]> {
  // Essayer le nom canonique d'abord, puis le nom brut
  const canonical = canonicalTeamName(teamName);
  const entry = ESPN_TEAM_IDS[canonical] ?? ESPN_TEAM_IDS[teamName];

  if (!entry) {
    throw new Error(
      `Équipe "${teamName}" (canonical: "${canonical}") non trouvée dans ESPN_TEAM_IDS. ` +
      `Clubs disponibles : ${Object.keys(ESPN_TEAM_IDS).join(", ")}`,
    );
  }

  return fetchEspnRoster(entry.id, entry.league);
}
