import { and, desc, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import { createDb } from "../client";
import { isQualityPressSource } from "../news-quality";
import { newsItems, type NewsItemCategory, type NewsItemKind } from "../schema";

export interface NewsItemRecord {
  id: string;
  kind: NewsItemKind;
  title: string;
  excerpt: string | null;
  url: string;
  source: string;
  category: NewsItemCategory;
  imageUrl: string | null;
  /** ISO 8601 */
  publishedAt: string;
}

type Db = ReturnType<typeof createDb>;

function toRecord(row: typeof newsItems.$inferSelect): NewsItemRecord {
  const { createdAt: _createdAt, ...rest } = row;
  return { ...rest, publishedAt: row.publishedAt.toISOString() };
}

export async function getLatestNewsItems(
  db: Db,
  limit = 5,
  kind?: NewsItemKind,
): Promise<NewsItemRecord[]> {
  const rows = await db
    .select()
    .from(newsItems)
    .where(kind ? eq(newsItems.kind, kind) : undefined)
    .orderBy(desc(newsItems.publishedAt))
    .limit(limit);
  return rows.map(toRecord);
}

/** Tous les articles d'un type, du plus récent au plus ancien. */
export async function getNewsItemsByKind(db: Db, kind: NewsItemKind): Promise<NewsItemRecord[]> {
  const rows = await db
    .select()
    .from(newsItems)
    .where(eq(newsItems.kind, kind))
    .orderBy(desc(newsItems.publishedAt));
  return rows.map(toRecord);
}

/** Articles récents, pour le dédoublonnage des nouveaux titres. */
export async function getNewsItemsSince(db: Db, since: Date): Promise<NewsItemRecord[]> {
  const rows = await db.select().from(newsItems).where(gte(newsItems.publishedAt, since));
  return rows.map(toRecord);
}

export async function upsertNewsItems(db: Db, items: NewsItemRecord[]): Promise<void> {
  if (items.length === 0) return;
  await db
    .insert(newsItems)
    .values(items.map((item) => ({ ...item, publishedAt: new Date(item.publishedAt) })))
    .onConflictDoUpdate({
      target: newsItems.id,
      set: {
        title: sql`excluded.title`,
        excerpt: sql`excluded.excerpt`,
        url: sql`excluded.url`,
        category: sql`excluded.category`,
        imageUrl: sql`excluded.image_url`,
        publishedAt: sql`excluded.published_at`,
      },
    });
}

/** Remplace l'ensemble des actus générées (les avant-matchs devenus obsolètes disparaissent). */
export async function replaceAutoNewsItems(db: Db, items: NewsItemRecord[]): Promise<void> {
  const ids = items.map((item) => item.id);
  await db
    .delete(newsItems)
    .where(
      ids.length > 0
        ? and(eq(newsItems.kind, "auto"), notInArray(newsItems.id, ids))
        : eq(newsItems.kind, "auto"),
    );
  await upsertNewsItems(db, items);
}

async function deleteNewsByIds(db: Db, ids: string[]): Promise<number> {
  let removed = 0;
  for (let offset = 0; offset < ids.length; offset += 500) {
    const chunk = ids.slice(offset, offset + 500);
    const deleted = await db
      .delete(newsItems)
      .where(inArray(newsItems.id, chunk))
      .returning({ id: newsItems.id });
    removed += deleted.length;
  }
  return removed;
}

/** Retire la presse hors liste blanche. Les articles de qualité ne sont pas touchés. */
export async function deleteUnlistedPressArticles(db: Db): Promise<number> {
  const rows = await db
    .select({ id: newsItems.id, source: newsItems.source })
    .from(newsItems)
    .where(eq(newsItems.kind, "article"));
  const ids = rows.filter((row) => !isQualityPressSource(row.source)).map((row) => row.id);
  return deleteNewsByIds(db, ids);
}

/**
 * Supprime les articles de presse plus anciens que `olderThan`, en conservant
 * au moins `minRemaining` articles de qualité (les plus récents), même datés.
 */
export async function pruneStalePressArticles(
  db: Db,
  olderThan: Date,
  minRemaining: number,
): Promise<number> {
  const rows = await db
    .select({ id: newsItems.id, source: newsItems.source, publishedAt: newsItems.publishedAt })
    .from(newsItems)
    .where(eq(newsItems.kind, "article"))
    .orderBy(desc(newsItems.publishedAt));
  const quality = rows.filter((row) => isQualityPressSource(row.source));
  const staleIds = quality
    .slice(minRemaining)
    .filter((row) => row.publishedAt < olderThan)
    .map((row) => row.id);
  return deleteNewsByIds(db, staleIds);
}
