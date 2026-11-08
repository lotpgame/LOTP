/**
 * Kulüp logosu ızgaraları → tek tek şeffaf logolar (GLOBAL havuz, ülke-bağımsız).
 * Kaynak: LOTP-HamGrafik/Takımlar-Alternatıve/1..5.png — her biri 10x6 = 60 abstract renkli crest (açık degrade zemin).
 * Çıkış: public/img/clubs/club-1..300.webp. node scripts/slice-clublogos.mjs
 *
 * Kesim: TAM ondalık hücre sınırı (kayma yok) → açık degrade zemini kenardan flood-fill ile şeffaf →
 * sadece BÜYÜK bağlı bileşenleri tut (komşu logonun kenara düşen dilimini at) → trim → kareye ortala.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Takımlar-Alternatıve";
const OUT = resolve("public/img/clubs");
const COLS = 10, ROWS = 6, BG_T = 158;
const bound = (i, n, tot) => Math.round((i * tot) / n); // kayma yok

async function cut(region) {
  const { data, info } = await sharp(region).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const lum = (p) => 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
  // 1) açık degrade zemin: kenardan flood-fill
  const bg = new Uint8Array(N), q = [];
  const seed = (x, y) => { const p = y * W + x; if (!bg[p] && lum(p) > BG_T) { bg[p] = 1; q.push(p); } };
  for (let x = 0; x < W; x++) { seed(x, 0); seed(x, H - 1); }
  for (let y = 0; y < H; y++) { seed(0, y); seed(W - 1, y); }
  let hd = 0;
  while (hd < q.length) { const p = q[hd++], x = p % W, y = (p - x) / W;
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
      if (!bg[np] && lum(np) > BG_T) { bg[np] = 1; q.push(np); }
    }
  }
  // 2) ön plan bağlı bileşenleri → sadece büyükleri (>=max*0.12) tut (komşu dilimini at)
  const lab = new Int32Array(N); let nl = 0; const sizes = [0];
  for (let p = 0; p < N; p++) {
    if (bg[p] || lab[p]) continue;
    nl++; sizes.push(0); const qq = [p]; lab[p] = nl; let hc = 0;
    while (hc < qq.length) { const c = qq[hc++], x = c % W, y = (c - x) / W; sizes[nl]++;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
        if (!bg[np] && !lab[np]) { lab[np] = nl; qq.push(np); }
      }
    }
  }
  const mx = Math.max(1, ...sizes);
  const keep = new Uint8Array(nl + 1);
  for (let i = 1; i <= nl; i++) if (sizes[i] >= mx * 0.12) keep[i] = 1;
  for (let p = 0; p < N; p++) if (bg[p] || !keep[lab[p]]) data[p * 4 + 3] = 0;
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
  const IW = m.width, IH = m.height;
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    n++;
    const l0 = bound(c, COLS, IW), l1 = bound(c + 1, COLS, IW), t0 = bound(r, ROWS, IH), t1 = bound(r + 1, ROWS, IH);
    const ins = Math.round((l1 - l0) * 0.03);
    const region = await sharp(f).extract({ left: l0 + ins, top: t0 + ins, width: l1 - l0 - ins * 2, height: t1 - t0 - ins * 2 }).toBuffer();
    await sharp(await cut(region)).toFile(`${OUT}/club-${n}.webp`);
  }
  console.log(`✓ grid ${g} → club-${n - 59}..${n}`);
}
console.log(`\nBitti: ${n} logo → ${OUT}`);
