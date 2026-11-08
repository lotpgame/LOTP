/**
 * Kulüp logosu ızgaraları → tek tek şeffaf logolar (GLOBAL havuz, ülke-bağımsız) + TEKRAR AYIKLAMA.
 * Kaynak: LOTP-HamGrafik/Takımlar-Alternatıve/1..20.png — her biri BEYAZ zeminde 4×4 = 16 dairesel eskrim crest'i.
 * Çıkış: public/img/clubs/club-1..N.webp. node scripts/slice-clublogos.mjs
 *
 * Akış:
 *  1) Hücreyi BOŞLUĞA doğru genişleterek kes (EXP %9): bazı amblemler hücre sınırından taşıyor; dar kesim üst/alt/yanı
 *     düz kesiyordu (Kocaeli/Bursa üstten, Londra alttan). Geniş kesim tam amblemi alır; taşan komşu beyazla ayrılır.
 *  2) Beyaz zemini kenardan flood-fill ile şeffaf yap.
 *  3) Bağlı bileşenler: en büyük (ana amblem) + merkeze yakın büyükçe parçalar (defne/ışın) TUTULUR; kenardaki komşu
 *     dilimleri (centroid kenarda) ATILIR. Sonra trim + 214/256 kareye ortala (~%16 pay, çerçeveye yapışmaz).
 *  4) TEKRAR AYIKLA: ChatGPT aynı tasarımı çok sayfada tekrarlamış. 24×24 RGB imza + greedy (temsilci-bazlı) dedup
 *     (DEDUP_TH=21): "aynı tasarım + aynı renk" atılır; FARKLI RENK varyantları KALIR (kullanıcı 08.11).
 *  Sıra korunur; kalanlar club-1..N olarak numaralanır. (Numara değişebilir → clubLogo.ts CLUB_LOGO_COUNT güncellenir,
 *  Club.logoFile DB'de sıfırlanır ki kulüpler yeni havuzdan yeniden atansın.)
 */
import sharp from "sharp";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

sharp.cache(false); // Windows dosya kilidi olmasın

const SRC = "C:/Users/yusuf/Desktop/LOTP-HamGrafik/Takımlar-Alternatıve";
const OUT = resolve("public/img/clubs");
const SHEETS = 20, COLS = 4, ROWS = 4, BG_T = 238, EXP = 0.09, DEDUP_TH = 21, SIG = 24;
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
  // bağlı bileşenler + centroid → ana amblemi (en büyük + merkeze yakınlar) tut, kenardaki komşuyu at
  const lab = new Int32Array(N); let nl = 0; const sz = [0], cxA = [0], cyA = [0];
  for (let p = 0; p < N; p++) {
    if (bg[p] || lab[p]) continue;
    nl++; sz.push(0); cxA.push(0); cyA.push(0); const qq = [p]; lab[p] = nl; let hc = 0;
    while (hc < qq.length) { const cc = qq[hc++], x = cc % W, y = (cc - x) / W; sz[nl]++; cxA[nl] += x; cyA[nl] += y;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
        if (!bg[np] && !lab[np]) { lab[np] = nl; qq.push(np); }
      }
    }
  }
  let mx = 1, mxi = 0; for (let i = 1; i <= nl; i++) if (sz[i] > mx) { mx = sz[i]; mxi = i; }
  const keep = new Uint8Array(nl + 1);
  for (let i = 1; i <= nl; i++) {
    const cx = cxA[i] / sz[i], cy = cyA[i] / sz[i];
    const central = Math.abs(cx - W / 2) < W * 0.33 && Math.abs(cy - H / 2) < H * 0.33;
    if (i === mxi || (sz[i] >= mx * 0.04 && central)) keep[i] = 1;
  }
  for (let p = 0; p < N; p++) if (bg[p] || !keep[lab[p]]) data[p * 4 + 3] = 0;
  const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  let t; try { t = await sharp(png).trim({ threshold: 10 }).toBuffer(); } catch { t = png; }
  return sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(t).resize(214, 214, { fit: "inside" }).toBuffer(), gravity: "center" }])
    .webp({ quality: 90 }).toBuffer();
}

// Beyaz zemine düzleştirilmiş SIG×SIG RGB imza (tekrar ayıklama için). ÖNCE trim → amblemin kendi içeriğine göre.
async function signature(webp) {
  const flat = await sharp(webp).flatten({ background: "#ffffff" }).toBuffer();
  let tight; try { tight = await sharp(flat).trim({ threshold: 10 }).toBuffer(); } catch { tight = flat; }
  return sharp(tight).resize(SIG, SIG, { fit: "fill" }).raw().toBuffer();
}
const sigDist = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };

// 1–3) hepsini kes
const all = [];
for (let g = 1; g <= SHEETS; g++) {
  const f = `${SRC}/${g}.png`;
  if (!existsSync(f)) { console.log("! eksik:", `${g}.png`); continue; }
  const m = await sharp(f).metadata();
  const IW = m.width, IH = m.height;
  const buf = readFileSync(f);
  const ex = Math.round((IW / COLS) * EXP), ey = Math.round((IH / ROWS) * EXP);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const l0 = Math.max(0, bound(c, COLS, IW) - ex), l1 = Math.min(IW, bound(c + 1, COLS, IW) + ex);
    const t0 = Math.max(0, bound(r, ROWS, IH) - ey), t1 = Math.min(IH, bound(r + 1, ROWS, IH) + ey);
    const region = await sharp(buf).extract({ left: l0, top: t0, width: l1 - l0, height: t1 - t0 }).toBuffer();
    const emb = await cutEmblem(region);
    all.push({ emb, sig: await signature(emb) });
  }
  console.log(`✓ kesildi grid ${g}`);
}

// 4) greedy dedup (sıra korunur)
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
console.log(`→ ${OUT}/club-1..${n}.webp   (clubLogo.ts CLUB_LOGO_COUNT=${n} yap + DB: UPDATE "Club" SET "logoFile"='';)`);
