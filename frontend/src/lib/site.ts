import type { Metadata } from "next";

export const SITE_NAME = "OM Analytics";
export const SITE_DESCRIPTION =
  "Calendrier, classements, effectif, actus et Fan Zone : le programme de match de l'Olympique de Marseille.";

export const BRAND_COLORS = {
  paper: "#efebe3",
  ink: "#0b0e14",
  accent: "#00a3e0",
} as const;

function resolveSiteUrl(): string {
  if (process.env.SITE_URL) return process.env.SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();

/**
 * Les champs openGraph/twitter d'une page remplacent ceux du layout, image comprise :
 * on les reconstruit en entier. Un opengraph-image propre à la route reste prioritaire.
 */
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const fullTitle = `${title} · ${SITE_NAME}`;
  const images = ["/opengraph-image"];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", locale: "fr_FR", siteName: SITE_NAME, title: fullTitle, description, url: path, images },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}
