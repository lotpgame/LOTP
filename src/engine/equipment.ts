/**
 * Gladius ekipman kataloğu (GDD 15). Marka: GLADIUS. Denar (oyuncu bakiyesi) ile alınır.
 *
 * TASARIM (kullanıcı kararları, docs/EKONOMI.md):
 * - Mağaza SİLAHA GÖRE filtrelenir → `itemsForWeapon(weapon)`. Oyuncu yalnız kendi silahının + ortak
 *   malzemeleri görür. **Epe'de:** elektrikli yelek YOK, maske kordonu YOK (gösterilmez, satılmaz).
 * - **Elektrikli yelek (eski "lamé") silaha özeldir:** flöreciye "flöre için", kılıççıya "kılıç için";
 *   biri diğerininkini görmez.
 * - Fiyat sırası gerçekçi: Elektrikli Yelek (kılıç 550 / flöre 500) > Ceket+Pantolon (420) > Silah (400) …
 * - Maça etki ŞİMDİLİK minik ve GİZLİ (~0.003); "orta & adil" etki + yıpranma/büyüme RELEASE'te (EKONOMI §0,§2).
 *
 * CANLI VERİ KORUMA (CONTRIBUTING §2): eski generic id'ler (gl-weapon, gl-mask, gl-lame, gl-cord,
 * gl-maskcord) LEGACY_ITEMS'te gizli tutulur — daha önce alınmış eşya düşmesin diye. Ortak id'ler
 * (gl-clothing, gl-shoes, gl-socks, gl-plastron, gl-bag) AYNI kalır.
 */
import type { Weapon } from "@/engine/domain";

export type EquipmentSlot =
  | "WEAPON"
  | "MASK"
  | "CORD"
  | "MASK_CORD"
  | "CLOTHING"
  | "PLASTRON"
  | "GLOVE"
  | "LAME"
  | "CHEST"
  | "SHOES"
  | "SOCKS"
  | "BAG";

export interface GladiusItem {
  id: string;
  slot: EquipmentSlot;
  name: string;
  desc: string;
  icon: string;
  denar: number;
  /** null/undefined → ortak (her silahta görünür). Belirliyse yalnız o silahta görünür. */
  weapon?: Weapon;
  /** Maça katkı (effective strength). ŞİMDİLİK minik ve gizli. */
  combatBonus: number;
  cosmetic?: boolean;
  hidden?: boolean; // legacy — sahip olunca sayılır, mağazada gösterilmez
}

/** ⭐ TUNABLE: slot başına minik combat katkısı (şimdilik ~0.003; gerçek "orta & adil" etki release'te). */
const SLOT_BONUS: Record<EquipmentSlot, number> = {
  WEAPON: 0.004, LAME: 0.003, SHOES: 0.004, MASK: 0.003, CLOTHING: 0.003,
  GLOVE: 0.003, CHEST: 0.003, PLASTRON: 0.002, CORD: 0.002, MASK_CORD: 0.002,
  SOCKS: 0.001, BAG: 0,
};
const b = (s: EquipmentSlot) => SLOT_BONUS[s];

/** Ortak malzemeler — her silahta görünür (weapon yok). Eski id'ler korunur. */
const SHARED_ITEMS: readonly GladiusItem[] = [
  { id: "gl-clothing", slot: "CLOTHING", name: "Gladius Ceket + Pantolon", desc: "Beyaz koruyucu takım (alt + üst)", icon: "jacket", denar: 420, combatBonus: b("CLOTHING") },
  { id: "gl-shoes", slot: "SHOES", name: "Gladius Ayakkabı", desc: "Ayak tekniği / denge", icon: "shoes", denar: 280, combatBonus: b("SHOES") },
  { id: "gl-chest", slot: "CHEST", name: "Gladius Göğüs Koruyucu", desc: "Darbe koruyucu (göğüs)", icon: "chest", denar: 90, combatBonus: b("CHEST") },
  { id: "gl-plastron", slot: "PLASTRON", name: "Gladius Plastron", desc: "Kıyafet altına (koltuk altı koruyucu)", icon: "plastron", denar: 80, combatBonus: b("PLASTRON") },
  { id: "gl-socks", slot: "SOCKS", name: "Gladius Çorap", desc: "Uzun eskrim çorabı", icon: "socks", denar: 30, combatBonus: b("SOCKS") },
  { id: "gl-bag", slot: "BAG", name: "Gladius Çanta", desc: "Marka logolu taşıma çantası", icon: "bag", denar: 150, combatBonus: b("BAG"), cosmetic: true },
];

/** Flöre — hedef gövde; çene iletken maske + gövde elektrikli yelek + vücut/maske kordonu. */
const FOIL_ITEMS: readonly GladiusItem[] = [
  { id: "gl-lame-foil", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "Flöre için gerekli — gövdeyi kaplayan iletken yelek", icon: "lame", denar: 500, weapon: "FOIL", combatBonus: b("LAME") },
  { id: "gl-weapon-foil", slot: "WEAPON", name: "Gladius Flöre", desc: "Elektrikli flöre silahı", icon: "sword", denar: 400, weapon: "FOIL", combatBonus: b("WEAPON") },
  { id: "gl-mask-foil", slot: "MASK", name: "Gladius Flöre Maske", desc: "Çene altı iletken", icon: "mask", denar: 260, weapon: "FOIL", combatBonus: b("MASK") },
  { id: "gl-glove-foil", slot: "GLOVE", name: "Gladius Eldiven", desc: "Koruyucu eldiven", icon: "glove", denar: 150, weapon: "FOIL", combatBonus: b("GLOVE") },
  { id: "gl-cord-foil", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "Flöre soketli", icon: "cord", denar: 100, weapon: "FOIL", combatBonus: b("CORD") },
  { id: "gl-maskcord-foil", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Maskeyi yeleğe bağlar", icon: "mask-cord", denar: 50, weapon: "FOIL", combatBonus: b("MASK_CORD") },
];

/** Epe — tüm vücut hedef; YELEK YOK, MASKE KORDONU YOK; yalıtkan maske; 3 soketli kordon. */
const EPEE_ITEMS: readonly GladiusItem[] = [
  { id: "gl-weapon-epee", slot: "WEAPON", name: "Gladius Epe", desc: "Elektrikli epe silahı", icon: "sword", denar: 400, weapon: "EPEE", combatBonus: b("WEAPON") },
  { id: "gl-mask-epee", slot: "MASK", name: "Gladius Epe Maske", desc: "Yalıtkan, beyaz", icon: "mask", denar: 260, weapon: "EPEE", combatBonus: b("MASK") },
  { id: "gl-glove-epee", slot: "GLOVE", name: "Gladius Eldiven", desc: "Koruyucu eldiven", icon: "glove", denar: 150, weapon: "EPEE", combatBonus: b("GLOVE") },
  { id: "gl-cord-epee", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "3 soketli epe kordonu", icon: "cord", denar: 100, weapon: "EPEE", combatBonus: b("CORD") },
];

/** Kılıç — bel üstü + kol + kafa; iletken maske + gövde+kol yeleği + iletken eldiven; 2 soketli kordon + maske kordonu. */
const SABRE_ITEMS: readonly GladiusItem[] = [
  { id: "gl-lame-sabre", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "Kılıç için gerekli — gövde + kolları kaplayan iletken yelek", icon: "lame", denar: 550, weapon: "SABRE", combatBonus: b("LAME") },
  { id: "gl-weapon-sabre", slot: "WEAPON", name: "Gladius Kılıç", desc: "Elektrikli kılıç silahı", icon: "sword", denar: 400, weapon: "SABRE", combatBonus: b("WEAPON") },
  { id: "gl-mask-sabre", slot: "MASK", name: "Gladius Kılıç Maske", desc: "İçi-dışı iletken", icon: "mask", denar: 320, weapon: "SABRE", combatBonus: b("MASK") },
  { id: "gl-glove-sabre", slot: "GLOVE", name: "Gladius Eldiven", desc: "Manşet kısmı iletken", icon: "glove", denar: 150, weapon: "SABRE", combatBonus: b("GLOVE") },
  { id: "gl-cord-sabre", slot: "CORD", name: "Gladius Vücut Kordonu", desc: "2 soketli kılıç kordonu", icon: "cord", denar: 100, weapon: "SABRE", combatBonus: b("CORD") },
  { id: "gl-maskcord-sabre", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Maskeyi yeleğe bağlar", icon: "mask-cord", denar: 50, weapon: "SABRE", combatBonus: b("MASK_CORD") },
];

/** Mağazada gösterilen tam katalog (ortak + silaha özel). UI silaha göre filtreler → itemsForWeapon(). */
export const GLADIUS_ITEMS: readonly GladiusItem[] = [
  ...SHARED_ITEMS,
  ...FOIL_ITEMS,
  ...EPEE_ITEMS,
  ...SABRE_ITEMS,
];

/**
 * LEGACY — eski generic id'ler (v1). Sahip olunca hâlâ tanınır, bonusu sabit kalır; mağazada gösterilmez.
 * Canlı veri koruma (CONTRIBUTING §2).
 */
const LEGACY_ITEMS: readonly GladiusItem[] = [
  { id: "gl-weapon", slot: "WEAPON", name: "Gladius Silah", desc: "(eski katalog)", icon: "sword", denar: 400, combatBonus: 0.004, hidden: true },
  { id: "gl-mask", slot: "MASK", name: "Gladius Maske", desc: "(eski katalog)", icon: "mask", denar: 300, combatBonus: 0.003, hidden: true },
  { id: "gl-lame", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "(eski katalog)", icon: "lame", denar: 500, combatBonus: 0.003, hidden: true },
  { id: "gl-cord", slot: "CORD", name: "Gladius Body Cord", desc: "(eski katalog)", icon: "cord", denar: 100, combatBonus: 0.002, hidden: true },
  { id: "gl-maskcord", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "(eski katalog)", icon: "mask-cord", denar: 50, combatBonus: 0.002, hidden: true },
];

/** Tüm tanınan ürünler (katalog + legacy) — sahiplik/bonus aramaları için. */
const ALL_ITEMS: readonly GladiusItem[] = [...GLADIUS_ITEMS, ...LEGACY_ITEMS];

export function itemById(id: string): GladiusItem | undefined {
  return ALL_ITEMS.find((i) => i.id === id);
}

/**
 * Bir silaha uygun mağaza listesi: ortak malzemeler + yalnız o silaha özel malzemeler (legacy hariç).
 * Epe → yelek/maske kordonu otomatik dışarıda (o ürünler yalnız FOIL/SABRE'de tanımlı).
 */
export function itemsForWeapon(weapon: Weapon): GladiusItem[] {
  return GLADIUS_ITEMS.filter((i) => !i.hidden && (i.weapon == null || i.weapon === weapon));
}

/** Sahip olunan ekipmanların toplam maç katkısı (küçük). Legacy dahil. */
export function equipmentCombatBonus(ownedIds: readonly string[]): number {
  return ALL_ITEMS.filter((i) => ownedIds.includes(i.id)).reduce((acc, i) => acc + i.combatBonus, 0);
}

/** CSV → sahip olunan ürün id listesi (legacy dahil geçerli). */
export function parseOwned(csv: string): string[] {
  return (csv || "").split(",").map((s) => s.trim()).filter((s) => s && itemById(s) != null);
}

export function encodeOwned(ids: readonly string[]): string {
  return [...new Set(ids)].join(",");
}
