import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type NewsItemCategory = "mercato" | "match" | "club" | "blessure";

/** article = presse (RSS) ; auto = actu générée depuis football_snapshots. */
export type NewsItemKind = "article" | "auto";

export const newsItems = pgTable(
  "news_items",
  {
    id: text("id").primaryKey(),
    kind: text("kind").$type<NewsItemKind>().notNull(),
    title: text("title").notNull(),
    excerpt: text("excerpt"),
    url: text("url").notNull(),
    source: text("source").notNull(),
    category: text("category").$type<NewsItemCategory>().notNull(),
    imageUrl: text("image_url"),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("idx_news_items_published_at").on(table.publishedAt)],
);
