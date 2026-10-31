import type { MetadataRoute } from "next";
import { SITE_URL } from "@/src/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/", "/welcome"] },
    sitemap: new URL("/sitemap.xml", SITE_URL).toString(),
  };
}
