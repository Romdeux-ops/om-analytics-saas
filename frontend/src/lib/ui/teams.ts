const OM_NAME = "Marseille";

const SHORT_NAMES: Record<string, string> = {
  // Ligue 1 2026-2027
  Angers: "SCO",
  Auxerre: "AJA",
  Brest: "SB29",
  "Le Havre": "HAC",
  "Le Mans": "LM",
  Lens: "RCL",
  Lille: "LOSC",
  Lorient: "FCL",
  Lyon: "OL",
  Marseille: "OM",
  Monaco: "ASM",
  Nice: "OGCN",
  "Paris FC": "PFC",
  "Paris-SG": "PSG",
  Rennes: "SRFC",
  Strasbourg: "RCSA",
  Toulouse: "TFC",
  Troyes: "ESTAC",
  // Legacy / DB names
  "Olympique de Marseille": "OM",
  "Paris Saint-Germain": "PSG",
  "Olympique Lyonnais": "OL",
  "AS Monaco": "ASM",
  "LOSC Lille": "LOSC",
  "OGC Nice": "OGCN",
  "RC Lens": "RCL",
  "Stade Rennais": "SRFC",
};

/** Nom complet / officiel d'un club (pour affichage quand la place le permet). */
const FULL_NAMES: Record<string, string> = {
  Angers: "Angers SCO",
  Auxerre: "AJ Auxerre",
  Brest: "Stade Brestois",
  "Le Havre": "Le Havre AC",
  "Le Mans": "Le Mans FC",
  Lens: "RC Lens",
  Lille: "LOSC Lille",
  Lorient: "FC Lorient",
  Lyon: "Olympique Lyonnais",
  Marseille: "Olympique de Marseille",
  Monaco: "AS Monaco",
  Nice: "OGC Nice",
  "Paris FC": "Paris FC",
  "Paris-SG": "Paris Saint-Germain",
  Rennes: "Stade Rennais",
  Strasbourg: "RC Strasbourg",
  Toulouse: "Toulouse FC",
  Troyes: "ESTAC Troyes",
};

/** Nom court d'un club, sinon fallback sur le nom d'origine. */
export function shortTeamName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}

/** Nom complet d'un club, sinon fallback sur le nom d'origine. */
export function fullTeamName(name: string): string {
  return FULL_NAMES[name] ?? name;
}

export function isOmTeam(name: string): boolean {
  return name === OM_NAME || name === "Olympique de Marseille";
}

/** Monogramme (2-4 lettres) affiché dans les écussons. */
export function teamInitials(name: string): string {
  const short = SHORT_NAMES[name];
  if (short) return short;
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
