/**
 * Gladius ekipman görselleri → market/dolap thumbnail + lightbox tam görsel.
 *
 * Kaynak: LOTP-HamGrafik/Gladius/*.png — her biri KOLAJ (ana çekim + detay kareler, koyu stüdyo zemin).
 * - Thumbnail (<name>.webp, 512²): kare ürünlerde sol-üst ana çekim → koyu zemin trim → cover (ORTALI).
 *   Silahlarda kabza-merkezli kare. Koyu zemin KORUNUR (tema koyu → kart üstünde kesme gibi durur).
 * - Tam görsel (<name>-full.webp, ~1100px): kolajın tamamı (tüm açılar) → tıkla-büyüt lightbox.
 *
 * Kullanım: node scripts/slice-equipment.mjs "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Gladius"
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.argv[2] ?? "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Gladius");
const OUT = resolve("public/img/equipment");
mkdirSync(OUT, { recursive: true });

// [kaynak dosya, çıkış adı, tip]  — tip: "sq" (kare ürün) | "wpn" (silah, kabza-kare)
const MAP = [
  ["Ayakkabı.png", "shoes", "sq"],
  ["Canta.png", "bag", "sq"],
  ["Corap.png", "socks", "sq"],
  ["Plastron.png", "plastron", "sq"],
  ["Kadın-GogusKoruyucu.png", "chest", "sq"],
  ["Erkek-Ceket.png", "clothing-male", "sq"],
  ["Kadin-Ceket.png", "clothing-female", "sq"],
  // Flöre
  ["Flore-Maske.png", "foil-mask", "sq"],
  ["Flore-Eldiven.png", "foil-glove", "sq"],
  ["Flore-Kordon.png", "foil-cord", "sq"],
  ["Flore-MaskeKordonu.png", "foil-maskcord", "sq"],
  ["Flore-ElektrikliYelek.png", "foil-lame", "sq"],
  ["Flore-Silah - Size0.png", "foil-weapon-0", "wpn"],
  ["Flore-Silah - Size2.png", "foil-weapon-2", "wpn"],
  ["Flore-Silah - Size5.png", "foil-weapon-5", "wpn"],
  // Epe
  ["Epe-Maske.png", "epee-mask", "sq"],
  ["Epe-Eldiven.png", "epee-glove", "sq"],
  ["Epe-Kordon.png", "epee-cord", "sq"],
  ["Epe-Silah - Size0.png", "epee-weapon-0", "wpn"],
  ["Epe-Silah - Size2.png", "epee-weapon-2", "wpn"],
  ["Epe-Silah - Size5.png", "epee-weapon-5", "wpn"],
  // Kılıç
  ["Kılıc-Maske.png", "sabre-mask", "sq"],
  ["Kılıc-Eldiven.png", "sabre-glove", "sq"],
  ["Kılıc-Kordon.png", "sabre-cord", "sq"],
  ["Kılıc-MaskeKordonu.png", "sabre-maskcord", "sq"],
  ["Kılıc-ElektrikliYelek.png", "sabre-lame", "sq"],
  ["Kılıc-Silah - Size0.png", "sabre-weapon-0", "wpn"],
  ["Kılıc-Silah - Size2.png", "sabre-weapon-2", "wpn"],
  ["Kılıc-Silah - Size5.png", "sabre-weapon-5", "wpn"],
];

async function makeThumb(file, out, type) {
  const src = join(SRC, file);
  const m = await sharp(src).metadata();
  const W = m.width, H = m.height;
  let buf;
  if (type === "wpn") {
    // Silah: üst şeridin sağ-ortası (kabza + siperlik) → kare cover
    const side = Math.round(H * 0.52);
    const left = Math.round(W * 0.50);
    const top = Math.round(H * 0.05);
    buf = await sharp(src).extract({ left, top, width: Math.min(side, W - left), height: side }).toBuffer();
  } else {
    // Kare ürün: sol-üst ana çekim (sağ sütun ~0.70, alt sıra ~0.76'dan önce) → koyu zemin trim
    const region = { left: 0, top: 0, width: Math.round(W * 0.66), height: Math.round(H * 0.73) };
    const hero = await sharp(src).extract(region).toBuffer();
    try { buf = await sharp(hero).trim({ threshold: 20 }).toBuffer(); } catch { buf = hero; }
  }
  await sharp(buf).resize(512, 512, { fit: "cover", position: "center" }).webp({ quality: 88 }).toFile(join(OUT, `${out}.webp`));
}

async function makeFull(file, out) {
  // Kolajın tamamı → lightbox (tüm açılar). En büyük 1100px.
  await sharp(join(SRC, file)).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(OUT, `${out}-full.webp`));
}

let n = 0;
for (const [file, out, type] of MAP) {
  await makeThumb(file, out, type);
  await makeFull(file, out);
  n++;
  console.log(`✓ ${out}  (${file})`);
}
console.log(`\nBitti: ${n} ürün × (thumb + full) → ${OUT}`);
