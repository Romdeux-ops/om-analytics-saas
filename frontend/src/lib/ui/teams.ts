const OM_NAME = "Olympique de Marseille";

const SHORT_NAMES: Record<string, string> = {
  "Olympique de Marseille": "OM",
  "Paris Saint-Germain": "PSG",
  "Olympique Lyonnais": "OL",
  "AS Monaco": "ASM",
  "LOSC Lille": "LOSC",
  "OGC Nice": "OGCN",
  "RC Lens": "RCL",
  "Stade Rennais": "SRFC",
};

/** Nom court d'un club, sinon fallback sur le nom d'origine. */
export function shortTeamName(name: string): string {
  return SHORT_NAMES[name] ?? name;
}

export function isOmTeam(name: string): boolean {
  return name === OM_NAME;
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
