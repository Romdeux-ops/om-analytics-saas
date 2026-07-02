export type NewsCategory = "mercato" | "match" | "club" | "blessure";

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
}
