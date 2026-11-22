import type { MetadataRoute } from "next";

// Public sayfaların site haritası — Google/AdSense içerik sayfalarını keşfedip indeksleyebilsin (22.11).
// Oyun (/kariyer) giriş arkasında olduğu için haritaya dahil değil; yalnız herkese açık içerik.
const BASE = "https://www.lotpgame.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "", // ana sayfa
    "/eskrim",
    "/nasil-oynanir",
    "/hakkinda",
    "/sss",
    "/fiyatlandirma",
    "/kosullar",
    "/gizlilik",
    "/iade",
  ];
  const now = new Date();
  return routes.map((r) => ({
    url: `${BASE}${r}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: r === "" ? 1 : 0.7,
  }));
}
