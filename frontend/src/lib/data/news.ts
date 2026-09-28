import { unstable_cache } from "next/cache";
import { getLatestNewsItems, getNewsItemsByKind, pickDistinctPress, type NewsItemRecord } from "@om/db";
import { getDb } from "@/src/lib/db";
import type { NewsItem } from "@/src/lib/types/news";

/** Invalidé à la demande par POST /api/revalidate/football après chaque synchro. */
export const NEWS_CACHE_TAG = "news";

const loadNews = unstable_cache(
  async (): Promise<{ articles: NewsItemRecord[]; auto: NewsItemRecord | null }> => {
    try {
      const db = getDb();
      const [articles, [auto]] = await Promise.all([
        getNewsItemsByKind(db, "article"),
        getLatestNewsItems(db, 1, "auto"),
      ]);
      return { articles, auto: auto ?? null };
    } catch (error) {
      console.error("[news] Lecture de news_items impossible.", error);
      return { articles: [], auto: null };
    }
  },
  ["news-items"],
  { revalidate: 300, tags: [NEWS_CACHE_TAG] },
);

function toNewsItem(row: NewsItemRecord): NewsItem {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt ?? undefined,
    category: row.category,
    publishedAt: row.publishedAt,
    imageUrl: row.imageUrl ?? undefined,
    url: row.url,
    source: row.source,
    isAuto: row.kind === "auto",
  };
}

/**
 * Actus du menu. L'actu générée (résultat / avant-match), quand il y en a une, passe en tête.
 * Le reste ne vient que de la presse de la liste blanche, sans deux titres trop proches.
 * S'il n'y en a pas assez, on en montre moins, sans compléter avec d'autres sites.
 * Les articles de qualité déjà en base restent éligibles même s'ils datent.
 */
export async function getLatestNews(limit = 5): Promise<NewsItem[]> {
  const { articles, auto } = await loadNews();
  const press = pickDistinctPress(articles, auto ? limit - 1 : limit);
  const rows = auto ? [auto, ...press] : press;
  return rows.map(toNewsItem);
}
