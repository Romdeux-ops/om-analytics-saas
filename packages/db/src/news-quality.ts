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
const TITLE_SIMILARITY_THRESHOLD = 0.45;

/** Mots trop fréquents pour distinguer deux articles. */
const STOPWORDS = new Set([
  "om", "marseille", "olympique", "les", "des", "pour", "avec", "une", "dans", "sur", "est",
  "qui", "que", "son", "ses", "aux", "pas", "plus", "apres", "avant", "face", "contre", "cette",
  "par", "mais", "fait", "tout", "deja", "encore", "ils", "elle", "leur", "etre",
]);

/** Sujets hors équipe première masculine (foot féminin, équipes de jeunes, réserve). */
const EXCLUDED_TOPICS =
  /feminin|feminine|marseillaise|arkema|seconde ligue|d1f|u19|u20|u17|reserve|national 3|gambardella/;

/** Formats automatisés, live trackers de scores ou pages de statistiques qui ne sont pas de vrais articles. */
const EXCLUDED_FORMATS =
  /\bstatistiques\b|scores?\s*&\s*resultats?|autres\s+matches|direct\s+football|mises?\s+a\s+jour|\ben\s+direct\b|\blive\s+football\b|\blive\s+ticker\b/i;

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Détecte les titres qui ne sont qu'un intitulé brut de match sans contenu éditorial (ex: "Strasbourg - OM"). */
export function isMatchTickerOnly(rawTitle: string): boolean {
  return /^[\p{L}0-9\s.']+\s+(-|vs|v\.)\s+[\p{L}0-9\s.']+$/iu.test(rawTitle.trim());
}

/** Mots-clés garantissant que l'article traite bien de l'OM ou du football olympien. */
const OM_MENTION =
  /\bom\b|olympique|olympien|velodrome|phoceen|marseillais|\bgenesio\b|\bde zerbi\b|\blongoria\b|\bbenatia\b|\bmccourt\b/;

export function isOmRelated(title: string): boolean {
  const norm = normalize(title);
  return (
    OM_MENTION.test(norm) ||
    (norm.includes("marseille") &&
      (norm.includes("joueur") ||
        norm.includes("club") ||
        norm.includes("ligue 1") ||
        norm.includes("football") ||
        norm.includes("gouiri") ||
        norm.includes("cornelius") ||
        norm.includes("abdelli")))
  );
}

/** Vérifie si un titre correspond à un sujet exclu (hors OM, féminines, jeunes, direct-score...). */
export function isExcludedPressTitle(title: string): boolean {
  const norm = normalize(title);
  if (!isOmRelated(title)) return true;
  return EXCLUDED_TOPICS.test(norm) || EXCLUDED_FORMATS.test(norm) || isMatchTickerOnly(title);
}

export function isQualityPressSource(source: string): boolean {
  const name = normalize(source);
  if (!name) return false;
  return QUALITY_SOURCE_MARKERS.some((marker) => name.includes(marker));
}

function stem(word: string): string {
  if (word.startsWith("bless")) return "bless";
  if (word.startsWith("transfer")) return "transfert";
  if (word.startsWith("joueu")) return "joueur";
  if (word.startsWith("arbitr")) return "arbitre";
  if (word.startsWith("forfait")) return "forfait";
  if (word.startsWith("selection")) return "selection";
  if (word.startsWith("indisponib")) return "indisponib";
  if (word.endsWith("es") || word.endsWith("er") || word.endsWith("ez") || word.endsWith("ed")) {
    return word.slice(0, -2);
  }
  if (word.endsWith("s") || word.endsWith("e")) {
    return word.slice(0, -1);
  }
  return word;
}

function tokens(title: string): Set<string> {
  return new Set(
    normalize(title)
      .split(" ")
      .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
      .map(stem),
  );
}

export function titlesAreSimilar(a: string, b: string): boolean {
  const normA = normalize(a);
  const normB = normalize(b);
  if (normA === normB) return true;
  if (normA.length > 15 && normB.length > 15 && (normA.includes(normB) || normB.includes(normA))) {
    return true;
  }

  const tokA = tokens(a);
  const tokB = tokens(b);
  const minSize = Math.min(tokA.size, tokB.size);
  if (minSize === 0) return false;

  let shared = 0;
  for (const token of tokA) {
    if (tokB.has(token)) shared++;
  }

  // Jaccard similarity
  const unionSize = tokA.size + tokB.size - shared;
  const jaccard = shared / unionSize;
  if (jaccard >= TITLE_SIMILARITY_THRESHOLD && minSize >= 2) return true;

  // Overlap coefficient: si les mots-clés d'un titre court sont quasi tous dans l'autre
  const overlap = shared / minSize;
  if (overlap >= 0.6 && shared >= 3) return true;
  if (overlap >= 0.75 && minSize >= 2) return true;

  return false;
}

/** Les plus récents d'abord, sources de la liste blanche, sans deux titres trop proches et sans sujets exclus. */
export function pickDistinctPress<T extends { title: string; source: string }>(
  articles: readonly T[],
  limit: number,
): T[] {
  const picked: T[] = [];
  for (const article of articles) {
    if (!isQualityPressSource(article.source)) continue;
    if (isExcludedPressTitle(article.title)) continue;
    if (picked.some((kept) => titlesAreSimilar(kept.title, article.title))) continue;
    picked.push(article);
    if (picked.length >= limit) break;
  }
  return picked;
}
