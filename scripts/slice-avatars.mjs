/**
 * Avatar şerit → 4 kare kesici.
 *
 * ChatGPT'de üretilen her karakter, 4 yaşı (8/12/16/20) yan yana TEK yatay şerittir
 * (bkz. docs/DEVIR.md avatar promptu). Bu script her şeridi 4 kareye böler, yüzü
 * ortalayacak şekilde kırpar (alttaki yaş etiketi + panel ayraç çizgileri kırpma
 * dışında kalır) ve public/img/avatars/<prefix><NN>/<yaş>.webp olarak yazar.
 *
 * Kullanım:
 *   node scripts/slice-avatars.mjs <kaynakKlasör> <prefix>
 * Örnek:
 *   node scripts/slice-avatars.mjs "C:/Users/yusuf/Desktop/Karakterler/Erkek" b
 *   node scripts/slice-avatars.mjs "C:/Users/yusuf/Desktop/Karakterler/Kadin" g
 *
 * Dosya adındaki sayı = set numarası (1.png → b01). Numara sabittir: yeni şerit
 * eklenince (ör. 4.png) sadece o set üretilir, öncekiler bozulmaz (eklemeli).
 */
import sharp from "sharp";
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const AGES = [8, 12, 16, 20]; // şeritte soldan sağa panel sırası
// Dikey portre (3:4): kare çok yakın kalıyordu, çene/boyun kesiliyordu. Portre → baştan
// omuz başına kadar girer; küçük yuvarlak avatarda object-cover yüzü ortalar.
const OUT_W = 384;
const OUT_H = 512; // 3:4
const CROP_RATIO = OUT_H / OUT_W; // 1.333…
const OUT_ROOT = resolve("public/img/avatars");

/**
 * Bir panelde KAFANIN TEPESİNİ bulur (üstteki boşluğu kırpmak için — 8 yaşta kafa küçük/aşağıda olunca
 * sabit kırpım üstte mavi boşluk bırakıyordu). Backdrop düz renk (mavi/gri): y=12..28'den medyan alınır
 * (y0'da ince beyaz kenar olabilir, atlanır); sonra üstten ilk "backdrop'tan belirgin sapan" satır = kafa tepesi.
 */
async function detectHeadTop(src, left, w, H) {
  const { data, info } = await sharp(src).extract({ left, top: 0, width: w, height: H }).raw().toBuffer({ resolveWithObject: true });
  const W = info.width, ch = info.channels;
  const med = (a) => { a.sort((x, y) => x - y); return a[a.length >> 1]; };
  const rs = [], gs = [], bs = [];
  for (let y = 12; y < 28; y++) for (let x = 0; x < W; x += 3) { const p = (y * W + x) * ch; rs.push(data[p]); gs.push(data[p + 1]); bs.push(data[p + 2]); }
  const br = med(rs), bg = med(gs), bb = med(bs);
  for (let y = 28; y < H; y++) {
    let c = 0;
    for (let x = 0; x < W; x++) { const p = (y * W + x) * ch; if (Math.abs(data[p] - br) + Math.abs(data[p + 1] - bg) + Math.abs(data[p + 2] - bb) > 90) c++; }
    if (c > W * 0.1) return y;
  }
  return 0;
}

const [, , srcArg, prefix] = process.argv;
if (!srcArg || !prefix) {
  console.error('Kullanım: node scripts/slice-avatars.mjs "<kaynakKlasör>" <prefix: b|g>');
  process.exit(1);
}
const srcDir = resolve(srcArg);

const files = readdirSync(srcDir)
  .filter((f) => /^\d+\.(png|jpg|jpeg|webp)$/i.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

if (files.length === 0) {
  console.error("Kaynak klasörde sayı-adlı görsel yok:", srcDir);
  process.exit(1);
}

let made = 0;
for (const file of files) {
  const n = parseInt(file);
  const setId = prefix + String(n).padStart(2, "0");
  const src = join(srcDir, file);
  const meta = await sharp(src).metadata();
  const W = meta.width;
  const H = meta.height;
  const panelW = W / AGES.length;
  const inset = Math.round(panelW * 0.03); // ayraç çizgilerinden kaçın
  const cw = Math.floor(panelW) - inset * 2; // kesim genişliği (panele sığar)
  const ch = Math.min(Math.round(cw * CROP_RATIO), H); // 3:4 yükseklik
  const headroom = Math.round(ch * 0.08); // kafanın üstünde bırakılacak küçük pay

  const dir = join(OUT_ROOT, setId);
  mkdirSync(dir, { recursive: true });

  for (let i = 0; i < AGES.length; i++) {
    const left = Math.round(i * panelW) + inset;
    // Kafa tepesine göre kırpım (sabit değil): 8 yaşta kafa aşağıda → üstteki boşluk gider; her yaşta kafa üstte.
    const ht = await detectHeadTop(src, left, cw, H);
    let top = Math.max(0, ht - headroom);
    if (top + ch > H) top = H - ch;
    await sharp(src)
      .extract({ left, top, width: cw, height: ch })
      .resize(OUT_W, OUT_H)
      .webp({ quality: 86 })
      .toFile(join(dir, `${AGES[i]}.webp`));
  }
  made++;
  console.log(`✓ ${setId}  (${file}  ${W}x${H})  → ${AGES.join("/")}`);
}

console.log(`\nBitti: ${made} set → ${OUT_ROOT}`);

// ——— MANIFEST ———
// Mevcut TÜM setleri (diskteki hepsini) cinsiyete göre listele. Kod bunu import edip oyuncuya
// cinsiyete uygun yüz atar; slicer her çalıştığında güncellenir (yeni set → kod değişmeden devreye girer).
// src/data'ya yazılır (public/ Vercel'de runtime fs ile okunmayabilir; import edilen dosya bundle'lanır → güvenli).
const allSets = readdirSync(OUT_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^[bg]\d{2,}$/.test(d.name))
  .map((d) => d.name)
  .sort();
const manifest = {
  ages: AGES,
  b: allSets.filter((s) => s.startsWith("b")), // erkek setleri
  g: allSets.filter((s) => s.startsWith("g")), // kız setleri
  updatedAt: new Date().toISOString(),
};
const manifestDir = resolve("src/data");
mkdirSync(manifestDir, { recursive: true });
writeFileSync(join(manifestDir, "avatarManifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Manifest güncellendi: ${manifest.b.length} erkek + ${manifest.g.length} kız set → src/data/avatarManifest.json`);
