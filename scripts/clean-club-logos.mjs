/**
 * Kulüp logolarını YERİNDE temizler (numaralandırma değişmez → DB bağlaması bozulmaz).
 * Sorun: bazı club-N.webp'lerde komşu logonun kenara (sağ/üst…) düşen İNCE bir dilimi kalmış (slice payı %1).
 * Çözüm: her dosyada bağlı bileşenleri bul, sadece büyükleri (>=max*%8) tut (dilim atılır; defne/ışın korunur),
 * yeniden trim + 214/256 kareye ortala, ÜSTÜNE yaz. Re-slice YOK → club-N hep aynı kulübün logosu kalır.
 * Kullanım: node scripts/clean-club-logos.mjs
 */
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

sharp.cache(false); // dosya handle'ı tutma → üstüne yazarken kilit olmasın

const DIR = resolve("public/img/clubs");
const A_T = 40; // alfa eşiği: bunun üstü ön plan (dilim dolu ~255; kenar halesi düşük)

async function clean(file) {
  const inputBuf = readFileSync(file); // belleğe oku → path'e handle kalmaz
  const { data, info } = await sharp(inputBuf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, N = W * H;
  const fg = (p) => data[p * 4 + 3] > A_T;
  // bağlı bileşenler (4-komşu)
  const lab = new Int32Array(N); let nl = 0; const sizes = [0];
  for (let p = 0; p < N; p++) {
    if (!fg(p) || lab[p]) continue;
    nl++; sizes.push(0); const qq = [p]; lab[p] = nl; let hc = 0;
    while (hc < qq.length) { const cc = qq[hc++], x = cc % W, y = (cc - x) / W; sizes[nl]++;
      for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const np = ny * W + nx;
        if (fg(np) && !lab[np]) { lab[np] = nl; qq.push(np); }
      }
    }
  }
  const mx = Math.max(1, ...sizes);
  let dropped = 0;
  for (let p = 0; p < N; p++) if (lab[p] && sizes[lab[p]] < mx * 0.08) { data[p * 4 + 3] = 0; dropped++; }
  const png = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
  let t; try { t = await sharp(png).trim({ threshold: 10 }).toBuffer(); } catch { t = png; }
  const out = await sharp({ create: { width: 256, height: 256, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: await sharp(t).resize(214, 214, { fit: "inside" }).toBuffer(), gravity: "center" }])
    .webp({ quality: 90 }).toBuffer();
  await sharp(out).toFile(file); // input bellekten okundu → path serbest, üstüne yazılır
  return dropped;
}

const files = readdirSync(DIR).filter((f) => /^club-\d+\.webp$/.test(f));
let changed = 0;
for (const f of files) {
  const d = await clean(join(DIR, f));
  if (d > 0) changed++;
}
console.log(`Temizlendi: ${files.length} dosya tarandı, ${changed} tanesinde dilim/parça atıldı.`);
