"use client";

/**
 * Sürüm denetleyici — iOS "ana ekrana ekle" (PWA) eski sürümde donma sorununu çözer (kullanıcı 15.11).
 * iOS, ana-ekran uygulamasını yeniden açınca sayfayı YENİDEN YÜKLEMEZ (donmuş eski haliyle devam eder).
 * Bu bileşen: ilk görülen sürümü hatırlar; uygulama öne geldiğinde (visibilitychange) ve periyodik olarak
 * sunucudan güncel sürümü (/api/version) sorar; değişmişse sayfayı bir kez otomatik yeniler → yeni sürüm gelir.
 * Önbelleğe takılmamak için no-store + zaman damgası. Hiç UI çizmez.
 */
import { useEffect, useRef } from "react";

export function VersionWatcher() {
  const known = useRef<string | null>(null);
  const reloading = useRef(false);

  useEffect(() => {
    let alive = true;

    const check = async () => {
      if (reloading.current) return;
      try {
        const r = await fetch(`/api/version?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) return;
        const { v } = (await r.json()) as { v?: string };
        if (!alive || !v) return;
        if (known.current === null) {
          known.current = v; // ilk görülen sürüm = taban
        } else if (v !== known.current) {
          reloading.current = true;
          window.location.reload(); // yeni deploy algılandı → taze sürümü al
        }
      } catch {
        /* ağ hatası — sessizce geç, bir sonraki denemede tekrar bakılır */
      }
    };

    check();
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    const id = setInterval(check, 30_000); // yedek periyot; asıl tetik visibilitychange (öne gelince anında)

    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisible);
      clearInterval(id);
    };
  }, []);

  return null;
}
