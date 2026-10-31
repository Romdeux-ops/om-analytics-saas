import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/lib/site";

const ROUTES: { path: string; changeFrequency: "hourly" | "daily"; priority: number }[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/calendrier", changeFrequency: "daily", priority: 0.8 },
  { path: "/classement", changeFrequency: "daily", priority: 0.8 },
  { path: "/simulation", changeFrequency: "daily", priority: 0.7 },
  { path: "/effectif", changeFrequency: "daily", priority: 0.7 },
  { path: "/fan-zone", changeFrequency: "hourly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map(({ path, changeFrequency, priority }) => ({
    url: new URL(path, SITE_URL).toString(),
    lastModified,
    changeFrequency,
    priority,
  }));
}
