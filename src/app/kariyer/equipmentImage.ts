/**
 * Ekipman ürün görseli yardımcıları (saf). Oyuncunun silahı/cinsiyeti/beden → Gladius ürün görseli.
 * Görseller: public/img/equipment/<name>.webp (thumbnail) + <name>-full.webp (tam kolaj, lightbox).
 * Üretim: scripts/slice-equipment.mjs. Görsel yoksa (eşleşmezse) null → çağıran generic ikona düşer.
 */
import type { EquipmentSlot } from "@/engine/equipment";
import type { Gender, Weapon } from "@/engine/domain";

const WP: Record<Weapon, string> = { FOIL: "foil", EPEE: "epee", SABRE: "sabre" };

// Kıyafet grubu beden → ek: U10..U21 ek, büyükler ekSİZ (taban).
const GCAT = ["u10", "u12", "u14", "u17", "u21", ""] as const;
const garment = (base: string, size: number): string => {
  const s = GCAT[Math.max(0, Math.min(5, size))];
  return s ? `${base}-${s}` : base;
};
const cat3 = (size: number): number => (size >= 5 ? 5 : size >= 2 ? 2 : 0);

/**
 * Bir slotun (oyuncunun silahı/cinsiyeti/beden bağlamında) görsel adı.
 *  - Kıyafet grubu: 6 beden (U10..büyükler); ceket cinsiyete göre.
 *  - Silah/maske/çanta: 3 beden (0/2/5).
 *  - Silaha özel parçalar (maske/kordon/eldiven/yelek/maske kordonu): silah öneki.
 */
export function equipImageName(slot: EquipmentSlot, weapon: Weapon, gender: Gender, size = 0): string | null {
  const wp = WP[weapon];
  switch (slot) {
    case "SHOES": return garment("shoes", size);
    case "SOCKS": return garment("socks", size);
    case "PLASTRON": return garment("plastron", size);
    case "CHEST": return garment("chest", size);
    case "CLOTHING": return garment(gender === "FEMALE" ? "clothing-female" : "clothing-male", size);
    case "PANTS": return garment("pants", size);
    case "GLOVE": return garment(`${wp}-glove`, size);
    case "LAME": return garment(`${wp}-lame`, size);
    case "WEAPON": return `${wp}-weapon-${cat3(size)}`;
    case "MASK": return `${wp}-mask-${cat3(size)}`;
    case "BAG": return `bag-${cat3(size)}`;
    case "CORD": return `${wp}-cord`;
    case "MASK_CORD": return `${wp}-maskcord`;
    default: return null;
  }
}

export function equipThumb(name: string): string {
  return `/img/equipment/${name}.webp`;
}
export function equipFull(name: string): string {
  return `/img/equipment/${name}-full.webp`;
}
