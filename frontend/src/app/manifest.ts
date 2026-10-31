import type { MetadataRoute } from "next";
import { BRAND_COLORS, SITE_DESCRIPTION, SITE_NAME } from "@/src/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "OM Analytics",
    description: SITE_DESCRIPTION,
    lang: "fr",
    start_url: "/",
    display: "standalone",
    background_color: BRAND_COLORS.paper,
    theme_color: BRAND_COLORS.accent,
    icons: [
      { src: "/icon", sizes: "64x64", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
