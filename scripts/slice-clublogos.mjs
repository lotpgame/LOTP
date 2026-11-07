/**
 * Kulüp logosu ızgaraları → tek tek şeffaf logolar. Kaynak: LOTP-HamGrafik/Takımlar/<Ülke>-1.png
 * Her dosya 3x5 = 15 amblem (koyu zemin). Kesim: hücre → koyu zemini kenardan flood-fill ile şeffaf → trim → kareye ortala.
 * Çıkış: public/img/clubs/<cc>-<1..15>.webp. Kullanım: node scripts/slice-clublogos.mjs [sadece-cc]
 */
import sharp from "sharp";
import { mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const SRC = "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Takımlar";
const OUT = resolve("public/img/clubs");
mkdirSync(OUT, { recursive: true });

// Dosya adı → ülke kodu
const MAP = {
  "Türkiye": "tr", "France": "fr", "İtaly": "it", "Germany": "de", "Hungary": "hu", "Russia": "ru",
  "Poland": "pl", "Spain": "es", "UK": "gb", "Ukraine": "ua", "USA": "us", "Brazil": "br",
  "Japan": "jp", "SouthKorea": "kr", "China": "cn", "Australia": "au", "Egypt": "eg", "Tunisia": "tn",
};
const COLS = 5, ROWS = 3, BG_T = 60;

async function cell(buf, w, h) {
  // koyu zemini kenardan flood-fill → şeffaf
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const lum = (p) => 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
  const vis = new Uint8Array(W * H), q = [];
  const seed = (x, y) => { const p = y * W + x; if (!vis[p] && lum(p) < BG_T) { vis[p] = 1; q.push(p); } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  let hd = 0;
  while (hd < q.length) { const p = q[hd++], x = p % W, y = (p - x) / W;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
      if (!vis[np] && lum(np) < BG_T) { vis[np] = 1; q.push(np); }
    }
  }
  for (let p = 0; p < W * H; p++) if (vis[p]) data[p * 4 + 3] = 0;
  const cut = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  let t; try { t = await sharp(cut).trim({ threshold: 10 }).toBuffer(); } catch { t = cut; }
  return sharp({ create: { width: 512, height: 512, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(t).resize(500, 500, { fit: "inside" }).toBuffer(), gravity: "center" }])
    .webp({ quality: 90 }).toBuffer();
}

const only = process.argv[2];
let total = 0;
for (const [name, cc] of Object.entries(MAP)) {
  if (only && cc !== only) continue;
  const f = join(SRC, `${name}-1.png`);
  if (!existsSync(f)) { console.log("! eksik:", `${name}-1.png`); continue; }
  const m = await sharp(f).metadata();
  const cw = Math.floor(m.width / COLS), ch = Math.floor(m.height / ROWS);
  const inset = Math.round(cw * 0.015);
  let n = 0;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    n++;
    const left = c * cw + inset, top = r * ch + inset;
    const region = await sharp(f).extract({ left, top, width: cw - inset * 2, height: ch - inset * 2 }).toBuffer();
    const out = await cell(region, cw, ch);
    await sharp(out).toFile(join(OUT, `${cc}-${n}.webp`));
  }
  total += n;
  console.log(`✓ ${cc}  (${n} logo)`);
}
console.log(`\nBitti: ${total} logo → ${OUT}`);
