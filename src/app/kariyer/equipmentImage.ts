/**
 * Ekipman ürün görseli yardımcıları (saf). Oyuncunun silahı/cinsiyeti/beden → Gladius ürün görseli.
 * Görseller: public/img/equipment/<name>.webp (thumbnail) + <name>-full.webp (tam kolaj, lightbox).
 * Üretim: scripts/slice-equipment.mjs. Görsel yoksa (eşleşmezse) null → çağıran generic ikona düşer.
 */
import type { EquipmentSlot } from "@/engine/equipment";
import type { Gender, Weapon } from "@/engine/domain";

const WP: Record<Weapon, string> = { FOIL: "foil", EPEE: "epee", SABRE: "sabre" };

/**
 * Bir slotun (oyuncunun silahı/cinsiyeti/beden bağlamında) görsel adı. Silah: beden 0/2/5 varyantı.
 * Kıyafet: cinsiyet. Silaha özel parçalar (maske/kordon/eldiven/yelek/maske kordonu): silah öneki.
 */
export function equipImageName(slot: EquipmentSlot, weapon: Weapon, gender: Gender, size = 0): string | null {
  const wp = WP[weapon];
  switch (slot) {
    case "SHOES": return "shoes";
    case "BAG": return "bag";
    case "SOCKS": return "socks";
    case "PLASTRON": return "plastron";
    case "CHEST": return "chest";
    case "CLOTHING": return gender === "FEMALE" ? "clothing-female" : "clothing-male";
    case "WEAPON": return `${wp}-weapon-${size >= 5 ? 5 : size >= 2 ? 2 : 0}`;
    case "MASK": return `${wp}-mask`;
    case "CORD": return `${wp}-cord`;
    case "MASK_CORD": return `${wp}-maskcord`;
    case "GLOVE": return `${wp}-glove`;
    case "LAME": return `${wp}-lame`;
    default: return null;
  }
}

export function equipThumb(name: string): string {
  return `/img/equipment/${name}.webp`;
}
export function equipFull(name: string): string {
  return `/img/equipment/${name}-full.webp`;
}
