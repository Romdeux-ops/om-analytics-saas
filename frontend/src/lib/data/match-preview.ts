import { unstable_cache } from "next/cache";
import { shortTeamName } from "@/src/lib/ui/teams";
import type { StandingRow } from "@/src/lib/types/standing";
import type { TeamFormData } from "@/src/lib/data/team-form";
import type { CoachProfile } from "@/src/lib/data/coaches";
import { getArticleImage } from "@/src/lib/data/article-image";

export interface ScrapedPressArticle {
  title: string;
  source: string;
  url: string;
  publishedAt?: string;
  snippet?: string;
  imageUrl?: string;
}

export interface MatchEditorialPreview {
  isFromPress: boolean;
  pressSource?: string;
  pressUrl?: string;
  disclaimer?: string;
  headline: string;
  subheadline: string;
  sourceBadge: string;
  readTimeMinutes: number;
  publishedDateFormatted: string;
  paragraphs: string[];
  tacticalKeys: {
    title: string;
    description: string;
  }[];
  keyPlayer: {
    name: string;
    team: string;
    description: string;
  };
  tendency: {
    homeWinPct: number;
    drawPct: number;
    awayWinPct: number;
    predictionText: string;
  };
  pressArticles: ScrapedPressArticle[];
  isCustomized?: boolean;
  customizedAt?: string;
}

function parseRssItems(xml: string): Array<{
  title: string;
  link: string;
  source: string;
  description: string;
  pubDate?: string;
}> {
  const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
  const items: Array<{
    title: string;
    link: string;
    source: string;
    description: string;
    pubDate?: string;
  }> = [];

  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link[\s\S]*?>([\s\S]*?)<\/link>/i);
    const sourceMatch = block.match(/<source[\s\S]*?>([\s\S]*?)<\/source>/i);
    const descMatch = block.match(/<description[\s\S]*?>([\s\S]*?)<\/description>/i);
    const pubDateMatch = block.match(/<pubDate[\s\S]*?>([\s\S]*?)<\/pubDate>/i);

    const cleanCdata = (str?: string) =>
      (str || "")
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/&(amp|quot|#39|apos);/g, (_, e: string) => ({ amp: "&", quot: '"', "#39": "'", apos: "'" })[e] ?? "")
        .trim();

    const rawTitle = cleanCdata(titleMatch?.[1]);
    const link = cleanCdata(linkMatch?.[1]);
    let source = cleanCdata(sourceMatch?.[1]) || "Presse sportive";
    const description = cleanCdata(descMatch?.[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const pubDate = cleanCdata(pubDateMatch?.[1]);

    if (!rawTitle || !link) continue;

    // Extraire la source si incluse dans le titre (ex: "... - RMC Sport")
    let title = rawTitle;
    if (source === "Presse sportive" && title.includes(" - ")) {
      const parts = title.split(" - ");
      const possibleSource = parts[parts.length - 1].trim();
      if (possibleSource.length < 30) {
        source = possibleSource;
        title = parts.slice(0, -1).join(" - ").trim();
      }
    } else if (title.endsWith(` - ${source}`)) {
      title = title.slice(0, -(source.length + 3)).trim();
    }

    items.push({ title, link, source, description, pubDate });
  }
  return items;
}

/**
 * Recherche des articles de presse en ligne (Google News, La Provence, Foot Mercato, L'Équipe)
 * ciblant précisément la rencontre entre les deux clubs.
 */
async function searchPressArticlesForFixture(
  homeTeam: string,
  awayTeam: string,
): Promise<{
  bestArticle: ScrapedPressArticle | null;
  otherArticles: ScrapedPressArticle[];
}> {
  const opponent = homeTeam === "Marseille" ? awayTeam : homeTeam;
  const oppClean = opponent.replace(/^(ESTAC|RC|FC|AS|OGC|LOSC|Toulouse|Montpellier)\s+/i, "").trim();

  const query = encodeURIComponent(`("Marseille" OR "OM") "${oppClean}" Ligue 1`);
  const feeds = [
    `https://news.google.com/rss/search?q=${query}&hl=fr&gl=FR&ceid=FR:fr`,
    `https://www.footmercato.net/flux-rss`,
    `https://www.laprovence.com/rss/om.xml`,
  ];

  let bestArticle: ScrapedPressArticle | null = null;
  const otherArticles: ScrapedPressArticle[] = [];
  const seenUrls = new Set<string>();

  const oppRegex = new RegExp(oppClean, "i");
  const previewRegex = /avant[\s-]?match|face à|duel|choc|compo|onze|enjeux|diffus|chaine|recoit|deplacement|genesio|journee/i;

  for (const feedUrl of feeds) {
    try {
      const res = await fetch(feedUrl, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/rss+xml" },
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;

      const xml = await res.text();
      const items = parseRssItems(xml);

      for (const item of items) {
        if (seenUrls.has(item.link)) continue;
        seenUrls.add(item.link);

        const articleObj: ScrapedPressArticle = {
          title: item.title,
          source: item.source,
          url: item.link,
          snippet: item.description,
          publishedAt: item.pubDate,
        };

        // Est-ce un article d'avant-match ciblant cette affiche précise ?
        const matchesFixture = oppRegex.test(item.title) || oppRegex.test(item.description);
        const isPreviewTopic = previewRegex.test(item.title) || previewRegex.test(item.description);

        if (!bestArticle && matchesFixture && isPreviewTopic) {
          bestArticle = articleObj;
        } else if (matchesFixture || /om|marseille|genesio/i.test(item.title)) {
          if (otherArticles.length < 6) {
            otherArticles.push(articleObj);
          }
        }
      }

      if (bestArticle && otherArticles.length >= 4) break;
    } catch (err) {
      console.warn(`[match-preview] Erreur sur le flux ${feedUrl}:`, err);
    }
  }

  const withImages = await Promise.all(
    otherArticles.map(async (article) => ({
      ...article,
      imageUrl: (await getArticleImage(article.url)) ?? undefined,
    })),
  );

  return { bestArticle, otherArticles: withImages };
}

/**
 * Construit la présentation d'avant-match :
 * - Si un article de presse officiel est trouvé pour la rencontre, utilise son contenu avec attribution et lien vers l'article complet.
 * - Sinon, génère une présentation IA explicite basée sur les données réelles (sans mentionner mensongèrement un journal).
 */
export async function getMatchPreview(params: {
  homeTeam: string;
  awayTeam: string;
  homeStanding?: StandingRow;
  awayStanding?: StandingRow;
  homeForm: TeamFormData;
  awayForm: TeamFormData;
  homeCoach: CoachProfile;
  awayCoach: CoachProfile;
  matchDate: Date;
  matchday?: number;
  competition?: "ligue1" | "europa" | "coupe";
}): Promise<MatchEditorialPreview> {
  const {
    homeTeam,
    awayTeam,
    homeStanding,
    awayStanding,
    homeForm,
    awayForm,
    homeCoach,
    awayCoach,
    matchDate,
    matchday = 6,
    competition = "ligue1",
  } = params;

  const homeShort = shortTeamName(homeTeam);
  const awayShort = shortTeamName(awayTeam);
  const isEuropa = competition === "europa";
  const compLabel = isEuropa ? "Europa League" : "Ligue 1";
  const cacheKey = `preview-v5-${homeShort}-${awayShort}-${competition}-${matchDate.toISOString().slice(0, 10)}`;

  return unstable_cache(
    async () => {
      // 1. Recherche d'un article de presse réel d'avant-match
      const { bestArticle, otherArticles } = await searchPressArticlesForFixture(homeTeam, awayTeam);

      const homeRankStr = homeStanding ? `${homeStanding.rank}e (${homeStanding.points} pts)` : "milieu de tableau";
      const awayRankStr = awayStanding ? `${awayStanding.rank}e (${awayStanding.points} pts)` : "milieu de tableau";

      let isFromPress = false;
      let pressSource: string | undefined;
      let pressUrl: string | undefined;
      let disclaimer: string | undefined;
      let headline = "";
      let subheadline = "";
      let sourceBadge = "";
      let paragraphs: string[] = [];

      if (bestArticle) {
        // CAS A : Article de presse authentique trouvé
        isFromPress = true;
        pressSource = bestArticle.source;
        pressUrl = bestArticle.url;
        headline = bestArticle.title;
        subheadline = isEuropa
          ? `Dépêche et analyse d'avant-match publiées par ${bestArticle.source} pour la ${matchday}e journée de la phase de ligue d'Europa League.`
          : `Dépêche et analyse d'avant-match publiées par ${bestArticle.source} pour la ${matchday}e journée de Ligue 1.`;
        sourceBadge = `${bestArticle.source} · Dépêche d'Avant-Match`;

        const pressExcerpt =
          bestArticle.snippet &&
          !bestArticle.snippet.includes("&lt;") &&
          bestArticle.snippet.length > 25
            ? bestArticle.snippet
            : `Dans ses colonnes, ${bestArticle.source} détaille les enjeux majeurs de cette confrontation entre ${homeShort} et ${awayShort}.`;

        paragraphs = [
          pressExcerpt,
          `Sur le banc de touche, ce duel oppose ${homeCoach.name} (${homeCoach.system}) à ${awayCoach.name} (${awayCoach.system}). Pour ${homeShort}, l'organisation prônée par ${homeCoach.name} repose sur ${homeCoach.style.toLowerCase()}, tandis que ${awayShort} cherchera à imposer son propre rythme tactique.`,
          isEuropa
            ? `Au classement de la phase de ligue UEFA, ${homeShort} (${homeRankStr}) et ${awayShort} (${awayRankStr}) abordent ce rendez-vous européen : ${homeForm.points} point(s) pris en Europa League pour les locaux, contre ${awayForm.points} pour les visiteurs. L'issue du match sera déterminante dans la course à la qualification.`
            : `Au classement, ${homeShort} (${homeRankStr}) et ${awayShort} (${awayRankStr}) abordent ce match sous pression : seulement ${homeForm.points} point(s) pris lors des 5 dernières journées de Ligue 1 pour les locaux, contre ${awayForm.points} pour les visiteurs. L'issue de la rencontre aura un impact direct sur le classement de Ligue 1.`,
        ];
      } else {
        // CAS B : Aucun article de presse disponible -> Synthèse générée par IA (clairement indiquée)
        isFromPress = false;
        sourceBadge = "OM Analytics IA · Synthèse";
        disclaimer = isEuropa
          ? "Cette présentation d'avant-match a été générée par l'intelligence artificielle à partir des statistiques de la saison (forme en Europa League, classement de la phase de ligue UEFA et compositions probables)."
          : "Cette présentation d'avant-match a été générée par l'intelligence artificielle à partir des statistiques de la saison (forme des 5 derniers matchs, classement officiel et compositions probables).";
        headline = isEuropa
          ? `${homeShort} - ${awayShort} : Grand rendez-vous européen pour la ${matchday}e journée d'Europa League`
          : `${homeShort} - ${awayShort} : Le choc de la ${matchday}e journée sous haute tension`;
        subheadline = isEuropa
          ? `Respectivement ${homeRankStr} et ${awayRankStr} de la phase de ligue d'Europa League, les deux formations s'affrontent dans une rencontre charnière sur la scène continentale.`
          : `Respectivement ${homeRankStr} et ${awayRankStr} de Ligue 1, les deux formations s'affrontent dans une rencontre cruciale où la moindre erreur se paiera au prix fort.`;

        paragraphs = [
          isEuropa
            ? `C'est une grande affiche continentale qui s'annonce sur la pelouse ${
                homeTeam === "Marseille" ? "de l'Orange Vélodrome" : `du stade adverse face à ${homeShort}`
              }. Dans le nouveau format de la phase de ligue UEFA à 36 clubs, chaque point pèse lourd : ${homeShort} (${homeForm.points} pt(s) en Europa League) et ${awayShort} (${awayForm.points} pt(s)) entendent bien imposer leur loi pour faire un pas décisif vers le top 8 ou les barrages.`
            : `C'est une affiche charnière qui s'annonce sur la pelouse ${
                homeTeam === "Marseille" ? "de l'Orange Vélodrome" : `du stade adverse face à ${homeShort}`
              }. Avec un début d'exercice délicat et seulement ${homeForm.points} point(s) pris sur les 5 dernières journées de Ligue 1 pour ${homeShort} contre ${awayForm.points} point(s) pour ${awayShort}, les deux états-majors abordent ce duel avec l'impératif absolu d'engranger des points.`,
          `D'un point de vue tactique, l'affrontement entre ${homeCoach.name} et ${awayCoach.name} promet une vraie opposition de styles. D'un côté, le ${homeCoach.system} de ${homeShort} privilégie ${homeCoach.style.toLowerCase()}, misant sur une organisation rigoureuse. De l'autre, ${awayCoach.name} s'appuie sur ${awayCoach.style.toLowerCase()} avec son ${awayCoach.system}, exigeant une intensité continue dans les phases de transition.`,
          `Dans les vestiaires, le mot d'ordre est clair : retrouver de la solidité défensive et du réalisme dans le dernier geste. L'impact athlétique au milieu de terrain et la maîtrise des seconds ballons feront pencher la balance dans une rencontre qui s'annonce disputée jusqu'au coup de sifflet final.`,
        ];
      }

      const tacticalKeys = [
        {
          title: "La maîtrise du tempo au milieu",
          description: `La bataille de l'entrejeu sera primordiale : imposer sa loi physique pour couper les transitions adverses et alimenter rapidement les couloirs.`,
        },
        {
          title: "L'efficacité sur coups de pied arrêtés",
          description: `Dans un match fermé entre deux équipes en quête de certitudes, les phases arrêtées (corners, coups francs indirects) constitueront une arme de déblocage majeure.`,
        },
        {
          title: "La gestion du pressing haut",
          description: `La capacité de relancer court sous la pression déterminera qui aura le contrôle territorial et l'initiative des occasions.`,
        },
      ];

      const keyPlayer = awayTeam === "Marseille"
        ? {
            name: "Amine Gouiri",
            team: "Olympique de Marseille",
            description: "Auteur de 4 buts cette saison, l'attaquant olympien est le détonateur numéro un de l'attaque marseillaise.",
          }
        : {
            name: `${homeShort}`,
            team: homeTeam,
            description: "Le fer de lance offensif local, capable de faire basculer la rencontre sur un exploit individuel.",
          };

      const tendency = {
        homeWinPct: 32,
        drawPct: 28,
        awayWinPct: 40,
        predictionText: `Léger avantage aux visiteurs sur le papier, mais la détermination de ${homeShort} devant son public annonce un duel très disputé.`,
      };

      const publishedDateFormatted = new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date());

      return {
        isFromPress,
        pressSource,
        pressUrl,
        disclaimer,
        headline,
        subheadline,
        sourceBadge,
        readTimeMinutes: 3,
        publishedDateFormatted,
        paragraphs,
        tacticalKeys,
        keyPlayer,
        tendency,
        pressArticles: otherArticles,
      };
    },
    [cacheKey],
    { revalidate: 1800, tags: ["match-preview"] },
  )();
}
