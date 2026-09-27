import { and, desc, eq, gte, lt, notInArray, sql } from "drizzle-orm";
import { createDb } from "../client";
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

export async function pruneNewsItems(db: Db, olderThan: Date): Promise<void> {
  await db.delete(newsItems).where(lt(newsItems.publishedAt, olderThan));
}
