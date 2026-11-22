import type { MetadataRoute } from "next";

// Arama motoru kuralları + sitemap işareti (22.11). Public içerik taranabilir; API ve giriş-arkası taranmaz.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://www.lotpgame.com/sitemap.xml",
  };
}
