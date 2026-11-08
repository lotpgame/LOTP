/**
 * Kulüp logosu ızgaraları → tek tek şeffaf logolar (GLOBAL havuz, ülke-bağımsız).
 * Kaynak: LOTP-HamGrafik/Takımlar-Alternatıve/1..5.png — her biri 10x6 = 60 abstract renkli crest (açık degrade zemin).
 * Şehir figürü YOK → kulüplere rastgele dağıtılır (landmark-mismatch olmaz). Çıkış: public/img/clubs/club-1..300.webp
 * Kesim: hücre → açık degrade zemini kenardan flood-fill ile şeffaf → trim → kareye ortala. node scripts/slice-clublogos.mjs
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Takımlar-Alternatıve";
const OUT = resolve("public/img/clubs");
const COLS = 10, ROWS = 6, BG_T = 158; // açık degrade zemin: parlaklık > BG_T → arka plan

async function cut(region) {
  const { data, info } = await sharp(region).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const lum = (p) => 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
  const vis = new Uint8Array(W * H), q = [];
  const seed = (x, y) => { const p = y * W + x; if (!vis[p] && lum(p) > BG_T) { vis[p] = 1; q.push(p); } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  let hd = 0;
  while (hd < q.length) {
    const p = q[hd++], x = p % W, y = (p - x) / W;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
      if (!vis[np] && lum(np) > BG_T) { vis[np] = 1; q.push(np); }
    }
  }
  for (let p = 0; p < W * H; p++) if (vis[p]) data[p * 4 + 3] = 0;
  const raw = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  let t; try { t = await sharp(raw).trim({ threshold: 12 }).toBuffer(); } catch { t = raw; }
  return sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(t).resize(244, 244, { fit: "inside" }).toBuffer(), gravity: "center" }])
    .webp({ quality: 90 }).toBuffer();
}

let n = 0;
for (let g = 1; g <= 5; g++) {
  const f = `${SRC}/${g}.png`;
  if (!existsSync(f)) { console.log("! eksik:", `${g}.png`); continue; }
  const m = await sharp(f).metadata();
  const cw = Math.floor(m.width / COLS), ch = Math.floor(m.height / ROWS);
  const ins = Math.round(cw * 0.02);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    n++;
    const region = await sharp(f).extract({ left: c * cw + ins, top: r * ch + ins, width: cw - ins * 2, height: ch - ins * 2 }).toBuffer();
    await sharp(await cut(region)).toFile(`${OUT}/club-${n}.webp`);
  }
  console.log(`✓ grid ${g} → club-${n - 59}..${n}`);
}
console.log(`\nBitti: ${n} logo → ${OUT}`);
