import { ArrowUpRight } from "lucide-react";
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

const categoryGlow: Record<NewsCategory, string> = {
  mercato: "from-amber-500/12",
  match: "from-cyan-500/12",
  club: "from-blue-500/12",
  blessure: "from-red-500/12",
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

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  return (
    <article
      className={cn(
        "group/news relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:border-white/12 hover:bg-white/[0.04]",
        featured && "md:p-6",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity group-hover/news:opacity-100",
          categoryGlow[item.category],
        )}
      />

      <div className="relative flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CategoryChip category={item.category} />
          <span className="text-[10px] text-slate-500">{timeAgo(item.publishedAt)}</span>
        </div>
        <ArrowUpRight
          size={14}
          className="text-slate-600 transition-all group-hover/news:-translate-y-0.5 group-hover/news:translate-x-0.5 group-hover/news:text-cyan-300"
        />
      </div>

      <h3
        className={cn(
          "relative mt-3 font-bold leading-snug text-white",
          featured ? "font-tech text-xl md:text-2xl" : "text-sm line-clamp-3",
        )}
      >
        {item.title}
      </h3>

      <p
        className={cn(
          "relative mt-2 leading-relaxed text-slate-400",
          featured ? "text-sm line-clamp-3" : "text-xs line-clamp-2",
        )}
      >
        {item.excerpt}
      </p>
    </article>
  );
}
