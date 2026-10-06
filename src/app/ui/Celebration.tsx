"use client";

/**
 * Turnuva sonucu kutlaması (docs/GORSEL_ETKILESIM.md §6) — yoğunluk sonuca orantılı (tuş < madalya < şampiyonluk):
 * - madalya (2.–3.): sonuç kartının üstünden konfeti patlaması,
 * - şampiyonluk (1.): tam ekran katman — kupa kartı yaylanarak açılır, "Şampiyon" yazısı, bol konfeti (patlama + yağmur).
 * Saf CSS (globals.css hareket bloğu), kütüphane yok. Parçalar tamsayı tabanlı sabit tohumla dizilir → sunucu ve
 * tarayıcı aynı işaretlemeyi üretir. Hareketi azalt tercihinde hiçbir parça görünmez; katman birkaç saniye sonra
 * DOM'dan da kalkar. Konfeti renkleri eskrim lambaları + altın (sinyal renkleri, temadan bağımsız).
 */
import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "./Icon";

const COLORS = ["var(--sig-red)", "var(--sig-green)", "var(--sig-white)", "var(--prio)"];

type Piece = CSSProperties & Record<`--${string}`, string>;

/** mulberry32 — yalnız tamsayı işlemleri: her JS motorunda aynı dizi (hydration farkı çıkmaz). */
function seq(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let x = Math.imul(s ^ (s >>> 15), s | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Patlama: çıkış noktasından yukarı-yana fırlar (--x1/--y1), sonra aşağı düşer (--x2/--y2). */
function burst(n: number, seed: number, spread: number, up: number, fall: number): Piece[] {
  const r = seq(seed);
  return Array.from({ length: n }, (_, i) => {
    const x1 = Math.round((r() * 2 - 1) * spread);
    return {
      background: COLORS[i % COLORS.length],
      "--x1": `${x1}px`,
      "--y1": `${-Math.round(up * (0.35 + r() * 0.65))}px`,
      "--x2": `${Math.round(x1 * 1.25)}px`,
      "--y2": `${Math.round(fall * (0.6 + r() * 0.4))}px`,
      "--r1": `${Math.round(r() * 360)}deg`,
      "--r2": `${Math.round(360 + r() * 540)}deg`,
      "--d": `${Math.round(1500 + r() * 700)}ms`,
      "--delay": `${Math.round(r() * 120)}ms`,
    };
  });
}

/** Yağmur: ekranın üstünden, yatayda hafif salınarak düşer. */
function rain(n: number, seed: number): Piece[] {
  const r = seq(seed);
  return Array.from({ length: n }, (_, i) => ({
    left: `${Math.round(r() * 100)}%`,
    top: "-16px",
    background: COLORS[i % COLORS.length],
    "--x1": `${Math.round((r() * 2 - 1) * 40)}px`,
    "--x2": `${Math.round((r() * 2 - 1) * 80)}px`,
    "--r1": `${Math.round(r() * 360)}deg`,
    "--r2": `${Math.round(360 + r() * 720)}deg`,
    "--d": `${Math.round(1800 + r() * 700)}ms`,
    "--delay": `${Math.round(r() * 500)}ms`,
  }));
}

const MEDAL = burst(28, 7, 170, 90, 170);
const CHAMPION_BURST = burst(36, 11, 260, 220, 380);
const CHAMPION_RAIN = rain(44, 23);

export function Celebration({ level, label }: { level: "medal" | "champion"; label?: string }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setOn(false), level === "champion" ? 3200 : 2600);
    return () => clearTimeout(id);
  }, [level]);
  if (!on) return null;

  if (level === "medal") {
    // Yalnız yatayda kırpılır (sayfa yana kaymasın); yukarı fırlayan parçalar başlığın üstüne taşabilir.
    return (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-x-clip">
        {MEDAL.map((s, i) => (
          <span key={i} className="fx-confetti anim-confetti top-8 left-1/2" style={s} />
        ))}
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="fx-overlay anim-overlay pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {CHAMPION_RAIN.map((s, i) => (
        <span key={`r${i}`} className="fx-confetti anim-rain" style={s} />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {CHAMPION_BURST.map((s, i) => (
            <span key={`b${i}`} className="fx-confetti anim-confetti top-1/2 left-1/2" style={s} />
          ))}
          <div data-scope="console" className="anim-trophy relative rounded-xl border border-console-line px-8 py-6 text-center">
            <Icon name="trophy" size={56} className="mx-auto text-prio" />
            <div className="display mt-2 text-[34px] text-prio">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
