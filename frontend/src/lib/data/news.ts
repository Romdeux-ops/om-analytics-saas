import { MOCK_NEWS } from "@/src/lib/mock/news";
import type { NewsItem } from "@/src/lib/types/news";

export async function getLatestNews(limit = 5): Promise<NewsItem[]> {
  return MOCK_NEWS.slice(0, limit);
}
