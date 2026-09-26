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

/** Préfixes/suffixes juridiques ignorés pour la correspondance approximative. */
const NOISE_TOKENS = new Set([
  "fc", "afc", "ac", "sc", "sk", "nk", "as", "rc", "cf", "jk", "fk",
  "sco", "ogc", "rsc", "pfc", "tsg", "1901", "04", "29",
]);

function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

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
