import Image from "next/image";
import Link from "next/link";
import { BarChart3, ExternalLink } from "lucide-react";
import { cn } from "@/src/lib/ui/cn";
import type { NewsItem, NewsCategory } from "@/src/lib/types/news";

const categoryLabels: Record<NewsCategory, string> = {
  mercato: "Mercato",
  match: "Match",
  club: "Club",
  blessure: "Infirmerie",
};

const categoryChip: Record<NewsCategory, string> = {
  mercato: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  match: "bg-cyan-500/15 text-cyan-200 border-cyan-400/30",
  club: "bg-blue-500/15 text-blue-200 border-blue-400/30",
  blessure: "bg-red-500/15 text-red-200 border-red-400/30",
};

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

function CategoryChip({ category }: { category: NewsCategory }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        categoryChip[category],
      )}
    >
      {categoryLabels[category]}
    </span>
  );
}

const CARD_CLASS =
  "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.04]";

function NewsLink({ item, className, children }: { item: NewsItem; className: string; children: React.ReactNode }) {
  if (item.isAuto) {
    return (
      <Link href={item.url} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );
}

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  return (
    <NewsLink item={item} className={cn(CARD_CLASS, featured && "md:p-6")}>
      <article className="flex flex-1 flex-col">
        {featured && item.imageUrl && (
          <Image
            src={item.imageUrl}
            alt=""
            width={470}
            height={247}
            unoptimized
            className="-mx-4 -mt-4 mb-4 aspect-[470/247] w-[calc(100%+2rem)] max-w-none object-cover md:-mx-6 md:-mt-6 md:w-[calc(100%+3rem)]"
          />
        )}

        <div className="relative flex items-center gap-2">
          <CategoryChip category={item.category} />
          <span className="text-[10px] text-slate-500">{timeAgo(item.publishedAt)}</span>
        </div>

        <h3
          className={cn(
            "relative mt-3 font-bold leading-snug text-white group-hover:text-cyan-100",
            featured ? "font-tech text-xl md:text-2xl" : "text-sm line-clamp-3",
          )}
        >
          {item.title}
        </h3>

        {item.excerpt && (
          <p
            className={cn(
              "relative mt-2 leading-relaxed text-slate-400",
              featured ? "text-sm line-clamp-3" : "text-xs line-clamp-2",
            )}
          >
            {item.excerpt}
          </p>
        )}

        <p className="mt-auto flex items-center gap-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {item.isAuto ? <BarChart3 size={11} className="text-cyan-400" /> : <ExternalLink size={11} />}
          {item.source}
        </p>
      </article>
    </NewsLink>
  );
}
