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
