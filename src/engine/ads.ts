/**
 * Ödüllü Reklam + Denar Paketleri — monetization (docs/EKIPMAN_VE_OLAYLAR.md, Finans/HESAP.md).
 *
 * TASARIM (kullanıcı kararı):
 * - Reklam İSTENMEDEN açılmaz. Oyuncu Denar lazım olunca Market'teki "Denar" köşesine gider,
 *   ister reklam izleyip ödül alır, ister paket satın alır (opt-in).
 * - 1 ödüllü reklam → +2 Denar (çocuğa bedava Denar; bize reklam vereninden ~£0.004 saf kâr).
 * - Günde EN ÇOK 3 reklam → ekonomiyi korur (sınırsız Denar basılmasın) + 1 silaha ~133 reklam
 *   gerekir (reklamla silah ALINMAZ ilkesi, Finans/HESAP §3).
 *
 * Bu modül SAF: I/O yok, DB yok. Günlük sayaç mantığı + paket kataloğu. Gerçek reklam ağı entegrasyonu
 * app/sunucu katmanında; burası yalnız "hak/ödül" kuralı.
 */

/** Bir ödüllü reklamın Denar ödülü. ⭐ TUNABLE (Finans/HESAP: 2–5 aralığı, 2 seçildi). */
export const AD_REWARD = 2;
/** Günlük reklam tavanı (ekonomi koruması + çocuk için makul). ⭐ TUNABLE. */
export const AD_DAILY_CAP = 3;

/** Oyuncunun reklam sayacı durumu (Player.lastAdDay + Player.adsToday). */
export interface AdState {
  lastAdDay: number; // en son reklam izlenen oyun-günü (gün indeksi)
  adsToday: number; // o gün izlenen reklam sayısı
}

/** O gün kaç reklam izlendi? Yeni günse (lastAdDay ≠ bugün) sayaç 0'a düşmüş sayılır. */
export function adsWatchedToday(state: AdState, currentDay: number): number {
  return state.lastAdDay === currentDay ? state.adsToday : 0;
}

/** Bugün kalan reklam hakkı (0..AD_DAILY_CAP). */
export function adsLeftToday(state: AdState, currentDay: number): number {
  return Math.max(0, AD_DAILY_CAP - adsWatchedToday(state, currentDay));
}

/** Bugün reklam izleyip ödül alınabilir mi? */
export function canWatchAd(state: AdState, currentDay: number): boolean {
  return adsLeftToday(state, currentDay) > 0;
}

/**
 * Bir reklam izlendi → yeni sayaç durumu + kazanılan Denar. Hak yoksa ödül 0, durum değişmez
 * (çağıran yine de kontrol etmeli). Gün değişince sayaç otomatik sıfırlanır (adsWatchedToday).
 */
export function watchAd(state: AdState, currentDay: number): { state: AdState; reward: number } {
  if (!canWatchAd(state, currentDay)) return { state, reward: 0 };
  const watched = adsWatchedToday(state, currentDay);
  return { state: { lastAdDay: currentDay, adsToday: watched + 1 }, reward: AD_REWARD };
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
