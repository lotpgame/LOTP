import type { MetadataRoute } from "next";

/**
 * PWA manifest (Next 16). Oyun telefonda "Ana ekrana ekle" ile TAM EKRAN app gibi açılsın:
 * kendi ikonu + açılış rengi + YATAY yön (oyun yalnız yatay). start_url "/" (açılış sayfası).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Legends of the Piste",
    short_name: "LOTP",
    description: "Eskrim kariyer ve yönetim simülasyonu",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#0b0e12",
    theme_color: "#0b0e12",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
