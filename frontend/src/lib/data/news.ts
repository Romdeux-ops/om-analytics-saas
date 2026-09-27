import { unstable_cache } from "next/cache";
import { getLatestNewsItems, type NewsItemRecord } from "@om/db";
import { getDb } from "@/src/lib/db";
import type { NewsItem } from "@/src/lib/types/news";

/** Invalidé à la demande par POST /api/revalidate/football après chaque synchro. */
export const NEWS_CACHE_TAG = "news";

const loadNews = unstable_cache(
  async (limit: number): Promise<{ articles: NewsItemRecord[]; auto: NewsItemRecord | null }> => {
    try {
      const db = getDb();
      const [articles, [auto]] = await Promise.all([
        getLatestNewsItems(db, limit, "article"),
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
 * Actus les plus récentes. L'actu générée (résultat / avant-match), quand il y en a une,
 * passe en tête : c'est le contenu propre à l'app, vite noyé sous le flux de presse.
 */
export async function getLatestNews(limit = 5): Promise<NewsItem[]> {
  const { articles, auto } = await loadNews(limit);
  const rows = auto ? [auto, ...articles.slice(0, limit - 1)] : articles;
  return rows.map(toNewsItem);
}
