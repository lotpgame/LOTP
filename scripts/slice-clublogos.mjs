/**
 * Kulüp logosu ızgaraları → tek tek şeffaf logolar (GLOBAL havuz, ülke-bağımsız) + TEKRAR AYIKLAMA.
 * Kaynak: LOTP-HamGrafik/Takımlar-Alternatıve/1..20.png — her biri BEYAZ zeminde 4×4 = 16 dairesel eskrim crest'i.
 * Çıkış: public/img/clubs/club-1..N.webp. node scripts/slice-clublogos.mjs
 *
 * Akış:
 *  1) TAM ondalık hücre sınırı (kayma yok) ile 4×4 kes → %3 pay.
 *  2) Beyaz zemini kenardan flood-fill ile şeffaf yap → trim → 256px kareye ortala.
 *  3) TEKRAR AYIKLA: ChatGPT aynı tasarımı birçok sayfada tekrarlamış. 24×24 RGB imza + greedy
 *     (temsilci-bazlı) dedup: bir logo tüm temsilcilerden >= DEDUP_TH uzaksa yeni, değilse birebir kopya → atılır.
 *     DEDUP_TH=21: "aynı tasarım + aynı renk" olanları atar; FARKLI RENK varyantları (yeşil↔mavi eskrimci) KALIR
 *     (kullanıcı kararı 08.11: renk varyantı = farklı kulüp). 22+ farklı tasarımları birleştirmeye başladığı için üst sınır.
 *  Sıra korunur: ilk görülen renk/tasarım temsilci olur, kopyaları atılır; kalanlar club-1..N olarak yeniden numaralanır.
 */
import sharp from "sharp";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const SRC = "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Takımlar-Alternatıve";
const OUT = resolve("public/img/clubs");
const SHEETS = 20, COLS = 4, ROWS = 4, BG_T = 238, DEDUP_TH = 21, SIG = 24;
const bound = (i, n, tot) => Math.round((i * tot) / n);

async function cutEmblem(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const lum = (p) => 0.299 * data[p * 4] + 0.587 * data[p * 4 + 1] + 0.114 * data[p * 4 + 2];
  // beyaz zemin: kenardan flood-fill
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
  for (let p = 0; p < N; p++) if (bg[p]) data[p * 4 + 3] = 0;
  const raw = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  let t; try { t = await sharp(raw).trim({ threshold: 10 }).toBuffer(); } catch { t = raw; }
  return sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(t).resize(248, 248, { fit: "inside" }).toBuffer(), gravity: "center" }])
    .webp({ quality: 90 }).toBuffer();
}

// Beyaz zemine düzleştirilmiş SIG×SIG RGB imza (tekrar ayıklama için).
async function signature(webp) {
  return sharp(webp).flatten({ background: "#ffffff" }).resize(SIG, SIG, { fit: "fill" }).raw().toBuffer();
}
const sigDist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

// 1–2) hepsini kes
const all = [];
for (let g = 1; g <= SHEETS; g++) {
  const f = `${SRC}/${g}.png`;
  if (!existsSync(f)) { console.log("! eksik:", `${g}.png`); continue; }
  const m = await sharp(f).metadata();
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const l0 = bound(c, COLS, m.width), l1 = bound(c + 1, COLS, m.width), t0 = bound(r, ROWS, m.height), t1 = bound(r + 1, ROWS, m.height);
    const ins = Math.round((l1 - l0) * 0.03);
    const region = await sharp(f).extract({ left: l0 + ins, top: t0 + ins, width: l1 - l0 - ins * 2, height: t1 - t0 - ins * 2 }).toBuffer();
    const emb = await cutEmblem(region);
    all.push({ emb, sig: await signature(emb) });
  }
  console.log(`✓ kesildi grid ${g}`);
}

// 3) greedy dedup (sıra korunur)
const reps = [];
let dropped = 0;
for (const item of all) {
  let dup = false;
  for (const r of reps) if (sigDist(item.sig, r.sig) < DEDUP_TH) { dup = true; break; }
  if (dup) dropped++; else reps.push(item);
}

// yaz
let n = 0;
for (const r of reps) { n++; await sharp(r.emb).toFile(`${OUT}/club-${n}.webp`); }
console.log(`\nKesilen: ${all.length}  ·  Atılan (birebir kopya): ${dropped}  ·  Benzersiz: ${n}`);
console.log(`→ ${OUT}/club-1..${n}.webp   (clubLogo.ts CLUB_LOGO_COUNT=${n} olmalı)`);
