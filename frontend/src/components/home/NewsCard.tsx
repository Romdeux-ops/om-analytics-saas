import Image from "next/image";
import Link from "next/link";
import { cn } from "@/src/lib/ui/cn";
import { shortTeamName } from "@/src/lib/ui/teams";
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

const WEEKDAYS = "aujourd'hui|demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche";

/** Affiche de l'actu générée (avant-match ou résultat), qui n'a pas de photo de presse. */
function posterFromAuto(item: NewsItem): { kicker: string; verb: string; mark: string; line: string } {
  const line = item.excerpt?.split(".")[0] ?? "";
  const preview = item.title.match(new RegExp(`^L'OM (reçoit|se déplace chez) (.+?) (${WEEKDAYS})\\b`, "i"));
  if (preview) {
    const home = preview[1].toLowerCase() === "reçoit";
    return {
      kicker: "Avant-match",
      verb: home ? "reçoit" : "chez",
      mark: shortTeamName(preview[2]),
      line,
    };
  }
  const result = item.title.match(/^(Victoire|Défaite|Match nul) (\d+-\d+) (?:face à|sur la pelouse de) (.+)$/);
  if (result) {
    return {
      kicker: "Résultat",
      verb: result[1].toLowerCase(),
      mark: `${result[2].replace("-", "–")}  ${shortTeamName(result[3])}`,
      line,
    };
  }
  return { kicker: "OM Analytics", verb: "match", mark: "OM", line };
}

function AutoMatchArt({ item }: { item: NewsItem }) {
  const poster = posterFromAuto(item);
  return (
    <div className="ink-block mt-5 flex min-h-52 flex-1 flex-col justify-between gap-3 border border-ink p-4 [container-type:size] md:p-5">
      <p className="label text-paper/60">{poster.kicker}</p>
      <div className="min-w-0">
        <p
          className="display leading-[0.82] text-accent-inverse"
          style={{ fontSize: "min(7.5rem, 18cqh, 34cqi)" }}
        >
          OM
        </p>
        <p className="editorial my-1 text-2xl normal-case leading-none text-paper/75 md:text-3xl">{poster.verb}</p>
        <p
          className="display max-w-full overflow-hidden leading-[0.82]"
          style={{
            fontSize: `min(7.5rem, 18cqh, ${Math.round(150 / Math.max(poster.mark.length, 2))}cqi)`,
          }}
        >
          {poster.mark}
        </p>
      </div>
      <svg
        viewBox="0 0 320 88"
        preserveAspectRatio="xMidYMid meet"
        className="w-full flex-1 text-paper/40"
        aria-hidden="true"
      >
        <rect x="1" y="1" width="318" height="86" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="160" y1="1" x2="160" y2="87" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="160" cy="44" r="16" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="1" y="22" width="42" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <rect x="277" y="22" width="42" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      {poster.line && <p className="label text-paper/60">{poster.line}</p>}
    </div>
  );
}

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  const showPoster = featured && item.isAuto && !item.imageUrl;
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

        {showPoster && <AutoMatchArt item={item} />}

        <p className={cn("label flex items-center gap-1.5 pt-4 text-ink/50", showPoster ? "mt-4" : "mt-auto")}>
          {item.source}
          <span className="arrow text-ink">{item.isAuto ? "→" : "↗"}</span>
        </p>
      </article>
    </NewsLink>
  );
}
