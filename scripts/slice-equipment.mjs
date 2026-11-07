/**
 * Gladius ekipman görselleri → market/dolap thumbnail + lightbox tam görsel.
 *
 * Kaynak: LOTP-HamGrafik/Gladius/*.png — her biri KOLAJ (ana çekim + detay kareler, koyu stüdyo zemin).
 * Beden varyantları (kullanıcı kararı 07.11):
 *  - 6 beden (kategori): kıyafet/pantolon/göğüs/plastron/ayakkabı/çorap/eldiven/yelek → "<Ad> - U10..U21.png" + "<Ad>.png" (büyükler).
 *    Çıkış: <name>-u10..-u21 + <name> (büyükler, eksiz).
 *  - 3 beden (0/2/5): silah/maske/çanta → "<Ad> - Size0/2/5.png". Çıkış: <name>-0/-2/-5.
 *  - Bedensiz: kordon/maske kordonu → "<Ad>.png". Çıkış: <name>.
 *
 * Thumbnail (<name>.webp, 512²): kare ürün sol-üst ana çekim (trim+cover, ORTALI); silah kabza-kare. Koyu zemin korunur.
 * Tam görsel (<name>-full.webp, ~1100px): kolajın tamamı (lightbox).
 *
 * Kullanım: node scripts/slice-equipment.mjs "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Gladius"
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = resolve(process.argv[2] ?? "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Gladius");
const OUT = resolve("public/img/equipment");
mkdirSync(OUT, { recursive: true });

// 6 beden: [kaynak öneki, çıkış tabanı]. U10..U21 + taban (büyükler, eksiz).
const GARMENTS = [
  ["Erkek-Ceket", "clothing-male"],
  ["Kadin-Ceket", "clothing-female"],
  ["Pantalon", "pants"],
  ["Kadın-GogusKoruyucu", "chest"],
  ["Plastron", "plastron"],
  ["Ayakkabı", "shoes"],
  ["Corap", "socks"],
  ["Flore-Eldiven", "foil-glove"],
  ["Epe-Eldiven", "epee-glove"],
  ["Kılıc-Eldiven", "sabre-glove"],
  ["Flore-ElektrikliYelek", "foil-lame"],
  ["Kılıc-ElektrikliYelek", "sabre-lame"],
];
// 3 beden kare ürün (çanta + maskeler): Size0/2/5
const CAT3_SQ = [
  ["Canta", "bag"],
  ["Flore-Maske", "foil-mask"],
  ["Epe-Maske", "epee-mask"],
  ["Kılıc-Maske", "sabre-mask"],
];
// 3 beden silah (kabza-kare): Size0/2/5
const CAT3_WPN = [
  ["Flore-Silah", "foil-weapon"],
  ["Epe-Silah", "epee-weapon"],
  ["Kılıc-Silah", "sabre-weapon"],
];
// Bedensiz kare ürün (kordon/maske kordonu)
const SINGLE = [
  ["Flore-Kordon", "foil-cord"],
  ["Epe-Kordon", "epee-cord"],
  ["Kılıc-Kordon", "sabre-cord"],
  ["Flore-MaskeKordonu", "foil-maskcord"],
  ["Kılıc-MaskeKordonu", "sabre-maskcord"],
];

async function thumb(srcFile, outName, kind) {
  const m = await sharp(srcFile).metadata();
  const W = m.width, H = m.height;
  let buf;
  if (kind === "wpn") {
    const side = Math.round(H * 0.52), left = Math.round(W * 0.50), top = Math.round(H * 0.05);
    buf = await sharp(srcFile).extract({ left, top, width: Math.min(side, W - left), height: side }).toBuffer();
  } else {
    const hero = await sharp(srcFile).extract({ left: 0, top: 0, width: Math.round(W * 0.66), height: Math.round(H * 0.73) }).toBuffer();
    try { buf = await sharp(hero).trim({ threshold: 20 }).toBuffer(); } catch { buf = hero; }
  }
  await sharp(buf).resize(512, 512, { fit: "cover", position: "center" }).webp({ quality: 88 }).toFile(join(OUT, `${outName}.webp`));
  await sharp(srcFile).resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 82 }).toFile(join(OUT, `${outName}-full.webp`));
}

let n = 0, miss = [];
async function run(srcName, outName, kind) {
  const f = join(SRC, `${srcName}.png`);
  if (!existsSync(f)) { miss.push(`${srcName}.png`); return; }
  await thumb(f, outName, kind);
  n++;
  console.log(`✓ ${outName}`);
}

for (const [src, out] of GARMENTS) {
  for (const cat of ["U10", "U12", "U14", "U17", "U21"]) await run(`${src} - ${cat}`, `${out}-${cat.toLowerCase()}`, "sq");
  await run(src, out, "sq"); // taban = büyükler
}
for (const [src, out] of CAT3_SQ) for (const s of [0, 2, 5]) await run(`${src} - Size${s}`, `${out}-${s}`, "sq");
for (const [src, out] of CAT3_WPN) for (const s of [0, 2, 5]) await run(`${src} - Size${s}`, `${out}-${s}`, "wpn");
for (const [src, out] of SINGLE) await run(src, out, "sq");

console.log(`\nBitti: ${n} görsel × (thumb + full) → ${OUT}`);
if (miss.length) console.log(`UYARI eksik kaynak (${miss.length}): ${miss.join(", ")}`);
