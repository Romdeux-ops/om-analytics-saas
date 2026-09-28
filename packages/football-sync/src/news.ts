import { createHash } from "node:crypto";
import { XMLParser } from "fast-xml-parser";
import { isQualityPressSource, titlesAreSimilar, type NewsItemCategory, type NewsItemRecord } from "@om/db";
import { normalize } from "./text";

const LA_PROVENCE_FEED = "https://www.laprovence.com/rss/om.xml";
const GOOGLE_NEWS_FEED =
  "https://news.google.com/rss/search?q=%22Olympique+de+Marseille%22+when:7d&hl=fr&gl=FR&ceid=FR:fr";

/** Google News remonte aussi des articles qui citent l'OM en passant : on exige une mention dans le titre. */
const OM_MENTION = /\bom\b|marseill|olympien|velodrome|phoceen/;

/** Sujets hors équipe première masculine, exclus du fil (titre seulement : "réservé aux abonnés"…). */
const EXCLUDED_TOPICS = /feminin|reserve/;

const isExcluded = (title: string) => EXCLUDED_TOPICS.test(normalize(title));

const CATEGORY_RULES: [NewsItemCategory, RegExp][] = [
  ["blessure", /bless|forfait|infirmerie|indisponib|suspen|entorse|claquage|rechute|lesion|fracture|incertain|operation/],
  ["mercato", /mercato|transfert|recru|\bsign(e|er|ature)\b|\bpret\b|prete|\boffre\b|\bpiste\b|\bcible\b|contrat|prolong|clause|courtis|interesse|\bpropose\b/],
  ["match", /\bmatch|victoire|defaite|\bnul\b|\bcompo|\bscore|\bbuts?\b|buteur|ligue 1|europa|coupe de france|journee|conference de presse|resume|\bnotes\b|classement|adversaire|arbitr|avant match|deplacement|reception|\bchoc\b|classique|rencontre/],
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  htmlEntities: true,
  isArray: (name) => name === "item",
});

interface RssItem {
  title?: string;
  link?: string;
  guid?: string | { "#text": string };
  description?: string;
  pubDate?: string;
  category?: string | string[];
  enclosure?: { "@_url"?: string };
  source?: string | { "#text"?: string };
}

async function fetchFeed(url: string): Promise<RssItem[]> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/rss+xml" } });
  if (!res.ok) throw new Error(`RSS ${url} → HTTP ${res.status}`);
  const xml = parser.parse(await res.text());
  return (xml?.rss?.channel?.item as RssItem[] | undefined) ?? [];
}

const clean = (text: string | undefined) => (text ?? "").replace(/\s+/g, " ").trim();
const textOf = (value: string | { "#text"?: string } | undefined) =>
  clean(typeof value === "string" ? value : value?.["#text"]);

function articleId(url: string): string {
  return `article-${createHash("sha1").update(url).digest("hex").slice(0, 16)}`;
}

export function categorize(title: string, excerpt = ""): NewsItemCategory {
  const text = normalize(`${title} ${excerpt}`);
  return CATEGORY_RULES.find(([, rule]) => rule.test(text))?.[0] ?? "club";
}

function toDate(pubDate: string | undefined): string | null {
  const date = pubDate ? new Date(pubDate) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}

async function fetchLaProvence(): Promise<NewsItemRecord[]> {
  const items = await fetchFeed(LA_PROVENCE_FEED);
  return items.flatMap((item): NewsItemRecord[] => {
    const categories = [item.category ?? []].flat().join(" ");
    const url = clean(item.link);
    const title = clean(item.title);
    const publishedAt = toDate(item.pubDate);
    // Les articles "Premium" sont réservés aux abonnés de La Provence.
    if (!url || !title || !publishedAt || /premium/i.test(categories)) return [];
    const excerpt = clean(item.description) || null;
    if (isExcluded(title)) return [];
    return [
      {
        id: articleId(url),
        kind: "article",
        title,
        excerpt,
        url,
        source: "La Provence",
        category: categorize(title, excerpt ?? ""),
        imageUrl: item.enclosure?.["@_url"] ?? null,
        publishedAt,
      },
    ];
  });
}

async function fetchGoogleNews(): Promise<NewsItemRecord[]> {
  const items = await fetchFeed(GOOGLE_NEWS_FEED);
  return items.flatMap((item): NewsItemRecord[] => {
    const url = clean(item.link);
    const source = textOf(item.source) || "Presse";
    const rawTitle = clean(item.title);
    const title = rawTitle.endsWith(` - ${source}`) ? rawTitle.slice(0, -(source.length + 3)) : rawTitle;
    const publishedAt = toDate(item.pubDate);
    if (
      !url ||
      !title ||
      !publishedAt ||
      !isQualityPressSource(source) ||
      !OM_MENTION.test(normalize(title)) ||
      isExcluded(title)
    ) {
      return [];
    }
    return [
      {
        id: articleId(textOf(item.guid) || url),
        kind: "article",
        title,
        excerpt: null,
        url,
        source,
        category: categorize(title),
        imageUrl: null,
        publishedAt,
      },
    ];
  });
}

/**
 * Articles de presse publiés depuis `since`, sources de la liste blanche uniquement,
 * sans doublons entre eux ni avec les articles de qualité déjà en base.
 * La Provence passe en premier (image + extrait), puis Google News du plus ancien au plus récent :
 * pour une même info, on garde la première source qui l'a publiée.
 */
export async function fetchPressArticles(
  existing: NewsItemRecord[],
  since: Date,
): Promise<NewsItemRecord[]> {
  const [laProvence, google] = await Promise.allSettled([fetchLaProvence(), fetchGoogleNews()]);
  if (laProvence.status === "rejected" && google.status === "rejected") {
    throw new Error(`Aucun flux RSS disponible : ${laProvence.reason} / ${google.reason}`);
  }
  for (const result of [laProvence, google]) {
    if (result.status === "rejected") console.warn("⚠ Flux RSS indisponible :", result.reason);
  }

  const byDate = (a: NewsItemRecord, b: NewsItemRecord) => a.publishedAt.localeCompare(b.publishedAt);
  const cutoff = since.toISOString();
  const candidates = [
    ...(laProvence.status === "fulfilled" ? laProvence.value.sort(byDate) : []),
    ...(google.status === "fulfilled" ? google.value.sort(byDate) : []),
  ].filter((item) => item.publishedAt >= cutoff);

  const kept = existing.filter((item) => item.kind === "article" && isQualityPressSource(item.source));
  const keptIds = new Set(kept.map((item) => item.id));
  const fresh: NewsItemRecord[] = [];

  for (const item of candidates) {
    if (!isQualityPressSource(item.source) || keptIds.has(item.id)) continue;
    if (kept.some((known) => titlesAreSimilar(known.title, item.title))) continue;
    kept.push(item);
    keptIds.add(item.id);
    fresh.push(item);
  }

  return fresh;
}
