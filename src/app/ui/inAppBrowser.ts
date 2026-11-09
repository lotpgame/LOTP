/**
 * Uygulama içi tarayıcı tespiti (User-Agent) — Instagram/Facebook/TikTok gibi uygulamalar linki kendi
 * gömülü tarayıcısında açar. Oradaki iki bilinen sorun: (1) kalıcı oturum (çerez/localStorage) güvenilir
 * çalışmayabilir, (2) ekran YÖNÜ dikey kilitlidir → telefon yan çevrilemez, yatay oyun sıkışır.
 * Saf fonksiyonlar (I/O yok) → testli.
 */

/** Sadece Instagram iç tarayıcısı (uyarı şeridi bu metni Instagram'a özel yazıyor). */
export function isInstagramBrowser(userAgent: string | null | undefined): boolean {
  return !!userAgent && /instagram/i.test(userAgent);
}

/**
 * Herhangi bir uygulama içi (in-app) tarayıcı: Instagram, Facebook (FBAN/FBAV/FB_IAB), TikTok
 * (BytedanceWebview / musical_ly). Bunların hepsi dikey kilitli açtığı için "tarayıcıda aç" yönlendirmesi
 * gerekir (yoksa yatay oyun RotateGate'te sıkışır). Normal Chrome/Safari bu listeye girmez.
 */
export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  return !!userAgent && /instagram|fban|fbav|fb_iab|bytedancewebview|musical_ly|tiktok/i.test(userAgent);
}
