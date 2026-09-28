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
  // Fiyatlar gerçek oranlara göre (docs/EKONOMI.md, 28.09): iletken yelek en pahalı >
  // ceket+pantolon > silah > maske > ayakkabı > ... Etki (combatBonus) şimdilik minik ve GİZLİ;
  // "orta & adil" etki + yıpranma release'te gelir (docs/EKONOMI.md §0, §2).
  { id: "gl-lame", slot: "LAME", name: "Gladius Elektrikli Yelek", desc: "İletken yelek — ceketin üzerine (flöre/kılıç)", icon: "shield-bolt", denar: 500, combatBonus: 0.003 },
  { id: "gl-clothing", slot: "CLOTHING", name: "Gladius Ceket + Pantolon", desc: "Beyaz koruyucu takım (alt + üst)", icon: "shirt", denar: 420, combatBonus: 0.003 },
  { id: "gl-weapon", slot: "WEAPON", name: "Gladius Silah", desc: "Elektrikli silah (silahına uygun)", icon: "sword", denar: 400, combatBonus: 0.004 },
  { id: "gl-mask", slot: "MASK", name: "Gladius Maske", desc: "Koruyucu maske", icon: "mask", denar: 300, combatBonus: 0.003 },
  { id: "gl-shoes", slot: "SHOES", name: "Gladius Ayakkabı", desc: "Ayak tekniği / denge", icon: "shoe", denar: 280, combatBonus: 0.004 },
  { id: "gl-bag", slot: "BAG", name: "Gladius Çanta", desc: "Marka logolu taşıma çantası", icon: "briefcase", denar: 150, combatBonus: 0, cosmetic: true },
  { id: "gl-cord", slot: "CORD", name: "Gladius Body Cord", desc: "Beden kordonu", icon: "plug-connected", denar: 100, combatBonus: 0.002 },
  { id: "gl-plastron", slot: "PLASTRON", name: "Gladius Plastron", desc: "Kıyafet altına (koltuk altı koruyucu)", icon: "shield-half", denar: 80, combatBonus: 0.002 },
  { id: "gl-maskcord", slot: "MASK_CORD", name: "Gladius Maske Kordonu", desc: "Flöre/kılıç için", icon: "plug", denar: 50, combatBonus: 0.002 },
  { id: "gl-socks", slot: "SOCKS", name: "Gladius Çorap", desc: "Uzun eskrim çorabı", icon: "socks", denar: 30, combatBonus: 0.001 },
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
