import { normalize } from "./text";

/**
 * Noms canoniques utilisés par le front (frontend/src/lib/ui/teams.ts) :
 * les API renvoient "Paris Saint-Germain FC", "Bayer Leverkusen", "Besiktas"…
 * que l'on ramène vers "Paris-SG", "Leverkusen", "Beşiktaş" pour garder
 * les noms courts / complets et la détection de l'OM.
 */
const CANONICAL_NAMES = [
  "Angers",
  "Auxerre",
  "Brest",
  "Le Havre",
  "Le Mans",
  "Lens",
  "Lille",
  "Lorient",
  "Lyon",
  "Marseille",
  "Monaco",
  "Nice",
  "Paris FC",
  "Paris-SG",
  "Rennes",
  "Strasbourg",
  "Toulouse",
  "Troyes",
  "Beşiktaş",
  "Olympiacos",
  "Sturm Graz",
  "Leverkusen",
  "Levski Sofia",
  "Celta",
  "Celtic",
  "Anderlecht",
];

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
  "AJ Auxerre": "Auxerre",
  "ESTAC Troyes": "Troyes",
  "ES Troyes AC": "Troyes",
  "Olympiakos": "Olympiacos",
  "Olympiacos Piraeus": "Olympiacos",
  "Bayer Leverkusen": "Leverkusen",
  "Bayer 04 Leverkusen": "Leverkusen",
  "Celta Vigo": "Celta",
  "Celta de Vigo": "Celta",
  "RC Celta": "Celta",
};

/**
 * IDs ESPN pour chaque club — utilisés par l'endpoint roster
 * `/apis/site/v2/sports/soccer/{league}/teams/{id}/roster`.
 * Ligue 1 IDs validés via site.web.api.espn.com.
 */
export const ESPN_TEAM_IDS: Record<string, { id: string; league: string }> = {
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

/** Préfixes/suffixes juridiques ignorés pour la correspondance approximative. */
const NOISE_TOKENS = new Set([
  "fc", "afc", "ac", "sc", "sk", "nk", "as", "rc", "cf", "jk", "fk",
  "sco", "ogc", "rsc", "pfc", "tsg", "1901", "04", "29",
]);

function stripNoise(normalized: string): string {
  return normalized
    .split(" ")
    .filter((token) => !NOISE_TOKENS.has(token))
    .join(" ");
}

const exactIndex = new Map<string, string>();
const looseIndex = new Map<string, string>();

for (const name of CANONICAL_NAMES) {
  exactIndex.set(normalize(name), name);
  looseIndex.set(stripNoise(normalize(name)), name);
}
for (const [alias, name] of Object.entries(ALIASES)) {
  exactIndex.set(normalize(alias), name);
  looseIndex.set(stripNoise(normalize(alias)), name);
}

/**
 * Nom canonique à partir de plusieurs libellés candidats (nom court, nom long, sigle).
 * Sans correspondance, renvoie le premier candidat tel quel.
 */
export function canonicalTeamName(...candidates: (string | null | undefined)[]): string {
  const names = candidates
    .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
    .map((c) => c.trim());

  for (const name of names) {
    const match = exactIndex.get(normalize(name));
    if (match) return match;
  }
  for (const name of names) {
    const loose = stripNoise(normalize(name));
    const match = loose ? looseIndex.get(loose) : undefined;
    if (match) return match;
  }
  return names[0] ?? "Inconnu";
}
