import { NewsCard } from "@/src/components/home/NewsCard";
import { getLatestNews } from "@/src/lib/data/news";

export async function NewsFeed() {
  const news = await getLatestNews(5);
  const [featured, ...rest] = news;

  return (
    <section className="border-t-[6px] border-ink pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="label text-ink/60">
          <span className="text-accent-text">04</span> — Actu du club
        </p>
        <p className="label text-ink/60">Presse &amp; résultats</p>
      </div>
      <h2 className="display mt-3 border-b border-ink pb-4 text-5xl text-ink md:text-7xl">
        Ce qu&apos;on dit de l&apos;OM
      </h2>

      {news.length === 0 ? (
        <p className="editorial py-10 text-xl text-ink/60">Aucune actualité pour le moment.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {featured && (
            <div className="border-b border-ink py-6 lg:col-span-5 lg:border-b-0 lg:border-r lg:pr-8">
              <NewsCard item={featured} featured />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:col-span-7">
            {rest.map((item, i) => (
              <div
                key={item.id}
                className={
                  "border-b border-ink/25 py-6 sm:px-6 " +
                  (i % 2 === 0 ? "sm:border-r sm:border-r-ink/25 sm:pl-0 lg:pl-8" : "sm:pr-0")
                }
              >
                <NewsCard item={item} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
