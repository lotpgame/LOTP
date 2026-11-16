/**
 * Economy Engine — para, ödül ve gider (GDD 16). Sportif performansı hesaplamaz; turnuva
 * derecesini paraya çevirir (GDD 5.14). Skill geliştirmez (GDD 5.36).
 *
 * M6: seviye × derece ödül tablosu + ekipman yükseltme maliyeti. Sponsorluk/kulüp bütçesi sonra.
 */
import type { TournamentLevel } from "./domain";

// Başlangıç bakiyesi 50 (kullanıcı kararı 15.11): yeni oyuncu ufak bir tamponla başlar — ilk haftaların
// aidatı + kırılan gear için nefes alır. Parasız "para ver/reklam izle" ilk izlenimini önler (beta-dostu).
export const STARTING_BALANCE = 50;

/**
 * Seviye × derece → para ödülü (GDD 17.75). Prestij arttıkça ödül artar.
 * DENGE (kullanıcı kararı 10.11): ucuz ekonomiye göre yeniden ayarlandı — İLK 4 derece ödül alır (4. de).
 * Denar hâlâ kıt (asıl ödül ranking/prestij) ama çocuk kendi temel bakımını karşılayabilir.
 * Uluslararası (yılda 4, kotayla) daha büyük elit bonus.
 */
// DENGE (kullanıcı kararı 16.11 — para-modeli analizi, docs/EKONOMI_DENGE.md): "A-hibrit". Önceki tabloda şehir
// dışı/uluslararası turnuvada MADALİST (özellikle bronz) kayıt+yol masrafını çıkaramayıp zarar ediyordu. Artık
// ödül(3.) ≥ entry + o seviyenin uzak yolu + küçük marj → hiçbir madalist zarar etmez; zamların çoğu BRONZA
// gider (çoğu oyuncu bronza çıkamaz) → şişme minimal, asıl sink (podyum dışı + uluslararası katılım) korunur.
// Eskrimde bronz maçı yok → 3. ve 4. aynı değer (iki yarı finalist de 3.).
const PRIZE_TABLES: Record<TournamentLevel, Record<number, number>> = {
  IL: { 1: 10, 2: 6, 3: 3, 4: 3 },
  OPEN: { 1: 12, 2: 9, 3: 8, 4: 8 },
  TURKIYE: { 1: 22, 2: 14, 3: 9, 4: 9 },
  SATELLITE: { 1: 36, 2: 26, 3: 19, 4: 19 },
  GRAND_PRIX: { 1: 50, 2: 38, 3: 30, 4: 30 },
  EUROPEAN: { 1: 64, 2: 52, 3: 42, 4: 42 },
  WORLD_CUP: { 1: 100, 2: 80, 3: 64, 4: 64 },
};

export function prizeFor(level: TournamentLevel, position: number): number {
  return PRIZE_TABLES[level][position] ?? 0;
}

// Maça katılım ücreti (Dilim 2B): küçük, o seviyenin 1. ödülünün ALTINDA (engel değil, denge). İl bedava (çocuk/sık).
const ENTRY_FEES: Record<TournamentLevel, number> = {
  IL: 0, OPEN: 2, TURKIYE: 2, SATELLITE: 5, GRAND_PRIX: 10, EUROPEAN: 15, WORLD_CUP: 20,
};
export function entryFee(level: TournamentLevel): number {
  return ENTRY_FEES[level] ?? 0;
}

// Yol + konaklama gideri (kullanıcı kararı 16.11): gerçek eskrim gibi — ev sahibi şehir oyuncunun KENDİ şehriyse
// masraf YOK (ör. İl, ya da Türkiye şamp. tesadüfen kendi ilinde). Başka şehir (aynı ülke) → yurt-içi masraf;
// uluslararası seviyeler HER ZAMAN uzak (uçak+otel). Denar birikimini dengeleyen gider. ⭐ TUNABLE.
const TRAVEL_DOMESTIC_AWAY = 5; // başka il/şehir, aynı ülke (Türkiye şamp. başka ilde, Open başka şehir)
const TRAVEL_INTL: Partial<Record<TournamentLevel, number>> = {
  SATELLITE: 12,
  GRAND_PRIX: 18,
  EUROPEAN: 25,
  WORLD_CUP: 40,
};
export function travelCost(level: TournamentLevel, hostCity: string | null, playerCity: string): number {
  const intl = TRAVEL_INTL[level];
  if (intl != null) return intl; // uluslararası: her zaman uzak
  if (!hostCity || hostCity === playerCity) return 0; // yerel (İl, ya da ev sahibi = kendi şehrin)
  return TRAVEL_DOMESTIC_AWAY; // başka il/şehir, aynı ülke
}

/**
 * Kulüp HAFTALIK aidatı (kullanıcı kararı 10.11): her oyun-haftasında (7 gün, Pazar) kesilir; kulüp KALİTESİNE
 * (facility = tesis kalitesi 0–100; coachSkill bunu birebir takip eder) bağlı kademeli:
 *   0–20 → 2 · 20–40 → 4 · 40–60 → 6 · 60–80 → 8 · 80–100 → 10 Đ/hafta.
 * İyi kulüp = daha iyi gelişim ama daha pahalı (anlamlı seçim). Pazar ödenmezse o haftanın antrenmanı
 * %20 düşer + "aidat ödenmedi" olayı (careerService advanceDay).
 */
export function clubWeeklyDues(facility: number): number {
  const tier = Math.min(4, Math.floor(Math.max(0, facility) / 20)); // 0..4 (80–100 dahil en üst)
  return (tier + 1) * 2; // 2,4,6,8,10
}

/** Aidat ödenmeyen hafta için antrenman kazancı çarpanı (0.8 = %20 düşüş). */
export const DUES_UNPAID_TRAINING_MULT = 0.8;

export const MAX_EQUIPMENT_LEVEL = 5;

/** `level` → `level+1` yükseltme maliyeti. Üst seviyeler pahalıdır. */
export function equipmentUpgradeCost(level: number): number {
  return level * 500;
}
