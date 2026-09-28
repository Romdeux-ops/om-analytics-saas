/**
 * Presse affichée dans le menu. Les formes compactes couvrent les noms Google News
 * (`lequipe.fr`, `BFMTV`, `Franceinfo`…).
 */
const QUALITY_SOURCE_MARKERS = [
  "la provence",
  "laprovence",
  "l equipe",
  "lequipe",
  "rmc",
  "le parisien",
  "leparisien",
  "france football",
  "francefootball",
  "le figaro",
  "lefigaro",
  "le monde",
  "lemonde",
  "eurosport",
  "so foot",
  "sofoot",
  "20 minutes",
  "20minutes",
  "ouest france",
  "ouestfrance",
  "la marseillaise",
  "lamarseillaise",
  "afp",
  "bein",
  "bfm",
  "france info",
  "franceinfo",
];

/** Articles de presse conservés pour le menu, même s'ils sont anciens. */
export const PRESS_MENU_KEEP = 5;

/** Jaccard au-dessus duquel deux titres décrivent la même info. */
const TITLE_SIMILARITY_THRESHOLD = 0.5;

/** Mots trop fréquents pour distinguer deux articles. */
const STOPWORDS = new Set([
  "om", "marseille", "olympique", "les", "des", "pour", "avec", "une", "dans", "sur", "est",
  "qui", "que", "son", "ses", "aux", "pas", "plus", "apres", "avant", "face", "contre", "cette",
  "par", "mais", "fait", "tout", "deja", "encore", "ils", "elle", "leur", "etre",
]);

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isQualityPressSource(source: string): boolean {
  const name = normalize(source);
  if (!name) return false;
  return QUALITY_SOURCE_MARKERS.some((marker) => name.includes(marker));
}

function tokens(title: string): Set<string> {
  return new Set(normalize(title).split(" ").filter((word) => word.length >= 3 && !STOPWORDS.has(word)));
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (a.size < 3 || b.size < 3) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  return shared / (a.size + b.size - shared);
}

export function titlesAreSimilar(a: string, b: string): boolean {
  return similarity(tokens(a), tokens(b)) >= TITLE_SIMILARITY_THRESHOLD;
}

/** Les plus récents d'abord, sources de la liste blanche, sans deux titres trop proches. */
export function pickDistinctPress<T extends { title: string; source: string }>(
  articles: readonly T[],
  limit: number,
): T[] {
  const picked: T[] = [];
  for (const article of articles) {
    if (!isQualityPressSource(article.source)) continue;
    if (picked.some((kept) => titlesAreSimilar(kept.title, article.title))) continue;
    picked.push(article);
    if (picked.length >= limit) break;
  }
  return picked;
}
