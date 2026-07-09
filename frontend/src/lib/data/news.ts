import { MOCK_NEWS } from "@/src/lib/mock/news";
import type { NewsItem } from "@/src/lib/types/news";

export function getLatestNews(limit = 5): NewsItem[] {
  return MOCK_NEWS.slice(0, limit);
}
