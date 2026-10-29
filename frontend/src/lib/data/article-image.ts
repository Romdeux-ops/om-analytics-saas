import { unstable_cache } from "next/cache";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36";
const TIMEOUT_MS = 5000;

async function fetchText(url: string, init: RequestInit = {}): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, ...init.headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${url}`);
  return res.text();
}

/**
 * Les liens Google News (`news.google.com/rss/articles/…`) sont chiffrés : la vraie URL
 * ne s'obtient qu'en rejouant l'appel `batchexecute` de leur page de redirection.
 */
async function decodeGoogleNewsUrl(url: string): Promise<string> {
  const id = new URL(url).pathname.split("/").pop();
  if (!id) throw new Error("Identifiant Google News absent");
  const page = await fetchText(`https://news.google.com/rss/articles/${id}`);
  const signature = page.match(/data-n-a-sg="([^"]+)"/)?.[1];
  const timestamp = page.match(/data-n-a-ts="([^"]+)"/)?.[1];
  if (!signature || !timestamp) throw new Error("Signature Google News introuvable");

  const request = `["garturlreq",[["X","X",["X","X"],null,null,1,1,"US:en",null,1,null,null,null,null,null,0,1],"X","X",1,[1,1,1],1,1,null,0,0,null,0],"${id}",${timestamp},"${signature}"]`;
  const response = await fetchText("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
    body: "f.req=" + encodeURIComponent(JSON.stringify([[["Fbv4je", request]]])),
  });
  const decoded = JSON.parse(JSON.parse(response.split("\n\n")[1])[0][2])[1];
  if (typeof decoded !== "string") throw new Error("URL Google News non décodée");
  return decoded;
}

const META_IMAGE =
  /<meta[^>]+(?:property|name)=["'](?:og:image(?::secure_url)?|twitter:image)["'][^>]*>/i;

async function resolveArticleImage(url: string): Promise<string | null> {
  try {
    const articleUrl = url.includes("news.google.com/") ? await decodeGoogleNewsUrl(url) : url;
    const html = await fetchText(articleUrl);
    const content = html.match(META_IMAGE)?.[0].match(/content=["']([^"']+)["']/i)?.[1];
    return content ? new URL(content.replace(/&amp;/g, "&"), articleUrl).toString() : null;
  } catch (error) {
    console.warn(`[article-image] Pas d'image pour ${url}.`, error instanceof Error ? error.message : error);
    return null;
  }
}

/** Image d'illustration (og:image) d'un article de presse, mise en cache une journée. */
export const getArticleImage = unstable_cache(resolveArticleImage, ["article-image"], {
  revalidate: 60 * 60 * 24,
});
