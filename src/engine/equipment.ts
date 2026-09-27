/**
 * Gladius ekipman kataloğu (GDD 15). Marka: GLADIUS. Denar (oyuncu bakiyesi) ile alınır.
 *
 * TASARIM: Ekipmanın maça katkısı NEREDEYSE YOK (~0.003) — donanım prestij/his içindir, maçı yetenek
 * kazanır (kullanıcı kararı). Tüm katkı değerleri BURADA, tek yerde → kolayca değiştirilebilir (tunable).
 */

export type EquipmentSlot =
  | "WEAPON"
  | "MASK"
  | "CORD"
  | "MASK_CORD"
  | "CLOTHING"
  | "PLASTRON"
  | "LAME"
  | "SHOES"
  | "SOCKS"
  | "BAG";

export interface GladiusItem {
  id: string;
  slot: EquipmentSlot;
  name: string; // "Gladius Flöre"
  desc: string; // kısa açıklama
  icon: string; // Tabler ikon adı (UI)
  denar: number; // fiyat (Denar)
  /** Maça katkı (effective strength puanı). ÇOK küçük — tunable. */
  combatBonus: number;
  cosmetic?: boolean; // yalnız görünüm/marka (katkı 0)
}

/**
 * ⭐ TUNABLE: her ürünün maç katkısı (combatBonus). Hepsi ~0.003 mertebesinde — istenirse buradan
 * tek tek ayarlanır. Toplam (hepsi alınsa) ~0.02 → pratikte ihmal edilebilir.
 */
export const GLADIUS_ITEMS: readonly GladiusItem[] = [
  { id: "gl-weapon", slot: "WEAPON", name: "Gladius Silah", desc: "Elektrikli silah (silahına uygun)", icon: "sword", denar: 320, combatBonus: 0.004 },
  { id: "gl-mask", slot: "MASK", name: "Gladius Maske", desc: "Koruyucu maske", icon: "mask", denar: 180, combatBonus: 0.003 },
  { id: "gl-cord", slot: "CORD", name: "Gladius Body Cord", desc: "Beden kordonu", icon: "plug-connected", denar: 90, combatBonus: 0.002 },
  { id: "gl-maskcord", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Flöre/kılıç için", icon: "plug", denar: 60, combatBonus: 0.002 },
  { id: "gl-clothing", slot: "CLOTHING", name: "Gladius Kıyafet", desc: "Alt + üst takım", icon: "shirt", denar: 240, combatBonus: 0.003 },
  { id: "gl-plastron", slot: "PLASTRON", name: "Gladius Plastron", desc: "Kıyafet altına", icon: "shield-half", denar: 70, combatBonus: 0.002 },
  { id: "gl-lame", slot: "LAME", name: "Gladius Lamé", desc: "Yelek (flöre/kılıç)", icon: "shield-bolt", denar: 150, combatBonus: 0.003 },
  { id: "gl-shoes", slot: "SHOES", name: "Gladius Ayakkabı", desc: "Ayak tekniği / denge", icon: "shoe", denar: 200, combatBonus: 0.004 },
  { id: "gl-socks", slot: "SOCKS", name: "Gladius Çorap", desc: "Uzun eskrim çorabı", icon: "socks", denar: 30, combatBonus: 0.001 },
  { id: "gl-bag", slot: "BAG", name: "Gladius Çanta", desc: "Marka logolu taşıma çantası", icon: "briefcase", denar: 120, combatBonus: 0, cosmetic: true },
];

export function itemById(id: string): GladiusItem | undefined {
  return GLADIUS_ITEMS.find((i) => i.id === id);
}

/** Sahip olunan ekipmanların toplam maç katkısı (çok küçük). */
export function equipmentCombatBonus(ownedIds: readonly string[]): number {
  return GLADIUS_ITEMS.filter((i) => ownedIds.includes(i.id)).reduce((acc, i) => acc + i.combatBonus, 0);
}

/** CSV (virgülle) → sahip olunan ürün id listesi. */
export function parseOwned(csv: string): string[] {
  return (csv || "").split(",").map((s) => s.trim()).filter((s) => s && itemById(s) != null);
}

export function encodeOwned(ids: readonly string[]): string {
  return [...new Set(ids)].join(",");
}
