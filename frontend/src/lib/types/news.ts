export type NewsCategory = "mercato" | "match" | "club" | "blessure";

export interface NewsItem {
  id: string;
  title: string;
  excerpt?: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
  /** Lien vers l'article de presse, ou page interne pour les actus générées */
  url: string;
  source: string;
  /** Actu écrite par l'app à partir des résultats (pas un article de presse) */
  isAuto: boolean;
}
