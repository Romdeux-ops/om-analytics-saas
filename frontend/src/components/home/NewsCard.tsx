import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/ui/cn";
import type { NewsItem, NewsCategory } from "@/src/lib/types/news";

const categoryLabels: Record<NewsCategory, string> = {
  mercato: "Mercato",
  match: "Match",
  club: "Club",
  blessure: "Infirmerie",
};

function timeAgo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "À l'instant";
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

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
    <NewsLink item={item} className="group flex h-full flex-col">
      <article className="flex flex-1 flex-col">
        {item.imageUrl && (
          <div className="mb-4 overflow-hidden border border-ink bg-ink/10">
            <Image
              src={item.imageUrl}
              alt=""
              width={470}
              height={247}
              unoptimized
              className={cn(
                "w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
                featured ? "aspect-[470/247]" : "aspect-[16/9]",
              )}
            />
          </div>
        )}

        <p className="label flex items-center gap-2 text-ink/60">
          <span
            className={cn(
              "px-1.5 py-0.5",
              item.category === "match" ? "bg-accent text-on-accent" : "bg-ink text-paper",
            )}
          >
            {categoryLabels[item.category]}
          </span>
          <span>{timeAgo(item.publishedAt)}</span>
        </p>

        <h3
          className={cn(
            "editorial mt-3 text-ink decoration-accent decoration-2 underline-offset-4 group-hover:underline",
            featured ? "text-3xl leading-[1.05] md:text-4xl" : "text-xl leading-tight line-clamp-4",
          )}
        >
          {item.title}
        </h3>

        {item.excerpt && (
          <p
            className={cn(
              "mt-3 leading-relaxed text-ink/70",
              featured ? "text-[13px] line-clamp-4" : "text-xs line-clamp-3",
            )}
          >
            {item.excerpt}
          </p>
        )}

        <p className="label mt-auto flex items-center gap-1.5 pt-4 text-ink/50">
          {item.source}
          <span className="arrow text-ink">{item.isAuto ? "→" : "↗"}</span>
        </p>
      </article>
    </NewsLink>
  );
}
