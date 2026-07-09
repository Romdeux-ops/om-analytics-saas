import { Newspaper } from "lucide-react";
import { Card } from "@/src/components/ui/Card";
import { SectionHeading } from "@/src/components/ui/SectionHeading";
import { NewsCard } from "@/src/components/home/NewsCard";
import { getLatestNews } from "@/src/lib/data/news";

export function NewsFeed() {
  const news = getLatestNews(5);
  const [featured, ...rest] = news;

  return (
    <Card className="flex h-full flex-col">
      <SectionHeading
        title="Actu du club"
        subtitle="Les dernières infos sur l'OM"
        icon={<Newspaper size={16} />}
        action={
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Mock
          </span>
        }
      />

      {news.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">Aucune actualité pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {featured && (
            <div className="lg:col-span-1">
              <NewsCard item={featured} featured />
            </div>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
            {rest.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
