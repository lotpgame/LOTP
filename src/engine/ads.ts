/**
 * Ödüllü Reklam + Denar Paketleri — monetization (docs/EKIPMAN_VE_OLAYLAR.md, Finans/HESAP.md).
 *
 * TASARIM (kullanıcı kararı 15.11):
 * - Reklam İSTENMEDEN açılmaz (opt-in): oyuncu Denar lazım olunca Market'teki "Denar" köşesine gidip izler.
 * - 1 ödüllü reklam → +2 Denar.
 * - GERÇEK-ZAMAN COOLDOWN: her reklamdan sonra yeni hak **2 gerçek saat** sonra açılır (gün-bazlı tavan DEĞİL).
 *   Neden gerçek saat: reklam bir retention mekaniği — oyuncuyu gün içinde tekrar tekrar oyuna çeker; oyunun
 *   hızlandırılmış GMT saatiyle değil, DUVAR SAATİYLE işler. 2s → günde en çok ~12 hak (24 Đ).
 *   Plan: ortalama izleme ölçülüp (totalAdsWatched) gerekirse cooldown 1 saate indirilecek.
 *
 * Bu modül SAF: I/O yok, DB yok. Gerçek reklam ağı entegrasyonu (H5 Games Ads) app/sunucu katmanında.
 */

/** Bir ödüllü reklamın Denar ödülü. ⭐ TUNABLE (kullanıcı kararı 10.11: 2 Đ). */
export const AD_REWARD = 2;
/** Reklam cooldown süresi — bir reklamdan sonra yeni hakkın açılması. ⭐ TUNABLE (kullanıcı kararı 15.11: 2 saat). */
export const AD_COOLDOWN_MS = 2 * 60 * 60 * 1000;

/** Oyuncunun reklam durumu (Player.lastAdAt). Gerçek-zaman (epoch ms); null = hiç izlemedi. */
export interface AdState {
  lastAdAt: number | null; // en son reklam izlenen gerçek zaman (ms), null = hiç
}

/**
 * Reklamın tekrar hazır olacağı gerçek zaman (epoch ms). null = ŞU AN hazır (hiç izlemedi ya da cooldown bitti).
 * UI bununla geri sayım gösterir (duvar saatine göre; istemci canlı sayar).
 */
export function adReadyAtMs(state: AdState, nowMs: number): number | null {
  if (state.lastAdAt == null) return null;
  const ready = state.lastAdAt + AD_COOLDOWN_MS;
  return ready <= nowMs ? null : ready;
}

/** Şu an reklam izleyip ödül alınabilir mi? (cooldown bitti mi) */
export function canWatchAd(state: AdState, nowMs: number): boolean {
  return adReadyAtMs(state, nowMs) === null;
}

/**
 * Bir reklam izlendi → yeni durum (lastAdAt = şimdi) + kazanılan Denar. Cooldown bitmemişse ödül 0,
 * durum değişmez (çağıran yine de kontrol etmeli).
 */
export function watchAd(state: AdState, nowMs: number): { state: AdState; reward: number } {
  if (!canWatchAd(state, nowMs)) return { state, reward: 0 };
  return { state: { lastAdAt: nowMs }, reward: AD_REWARD };
}

// ——— Denar paketleri (gerçek para) — Market'te gösterim. Satın alma lansmanta Stripe'a bağlanır. ———
export interface DenarPackage {
  denar: number;
  gbp: string; // görünen fiyat (GBP) — Finans/HESAP §4.1
  best?: boolean; // "en iyi değer" rozeti (ana ürün ≈ tam takım)
}

/** Paket kataloğu (kullanıcı kararı 06.11): TEK ürün — 1.000 Đ / £4.99. Başka paket yok (sade "tok satıcı"). */
export const DENAR_PACKAGES: readonly DenarPackage[] = [
  { denar: 1000, gbp: "£4.99" },
];
