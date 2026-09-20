"use client";

/**
 * Devam eden insan eleme maçının o anki periyodunu satır satır akıtır (GDD 18.54).
 * Önceki periyotlar (instantThrough'a kadar) anında görünür; yalnız yeni periyot animasyonla akar.
 * Bileşen her yeni periyotta remount edilir (page'de key={log.length}) → shown doğru başlar.
 */
import { useEffect, useState, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";

/** Açıklanan son tuş satırından güncel skoru sayı çifti olarak çıkarır ("… 3–2" → {a:3,b:2}). */
function lastRevealedScore(lines: string[]): { a: number; b: number } | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/(\d+)\s*[–-]\s*(\d+)/);
    if (m) return { a: Number(m[1]), b: Number(m[2]) };
  }
  return null;
}

/** Eskrim cihazı gibi: sol taraf YEŞİL, sağ taraf KIRMIZI skor. */
export function ScoreBox({ a, b }: { a: number | null; b: number | null }) {
  return (
    <span className="tabular-nums font-bold">
      <span className="text-emerald-600 dark:text-emerald-400">{a ?? "•"}</span>
      <span className="mx-1 opacity-40">–</span>
      <span className="text-red-600 dark:text-red-400">{b ?? "•"}</span>
    </span>
  );
}

export interface CanliPeriyotProps {
  aName: string;
  oppName: string;
  scoreHuman: number;
  scoreOpp: number;
  log: string[];
  instantThrough: number; // bu indeksten öncesi anında gösterilir
  afterDone?: ReactNode; // periyot animasyonu bitince gösterilir (devre arası paneli — spoiler önler)
  locale?: Locale;
}

export function CanliPeriyot({ aName, oppName, scoreHuman, scoreOpp, log, instantThrough, afterDone, locale = "tr" }: CanliPeriyotProps) {
  const [shown, setShown] = useState(instantThrough);
  const [fast, setFast] = useState(false);
  const done = shown >= log.length;

  useEffect(() => {
    if (shown >= log.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), fast ? 250 : 800);
    return () => clearTimeout(id);
  }, [shown, fast, log.length]);

  return (
    <>
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-emerald-700 dark:text-emerald-300">🟢 {aName} (sen)</span>
        {/* Skor eskrim cihazı gibi: sen yeşil, rakip kırmızı. Canlıda son açıklanan tuşa göre güncellenir. */}
        {done ? (
          <ScoreBox a={scoreHuman} b={scoreOpp} />
        ) : (
          (() => {
            const s = lastRevealedScore(log.slice(0, shown));
            return <ScoreBox a={s?.a ?? null} b={s?.b ?? null} />;
          })()
        )}
        <span className="text-red-700 dark:text-red-300">{oppName} 🔴</span>
      </div>
      <ul className="mt-2 space-y-0.5 text-xs opacity-80">
        {log.slice(0, shown).map((line, i) => (
          <li key={i} className={i === shown - 1 && !done ? "text-emerald-600" : ""}>
            {line}
          </li>
        ))}
      </ul>
      {!done && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => setFast((f) => !f)}
            className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            {fast ? t(locale, "mac.normal") : t(locale, "mac.fast")}
          </button>
          <button
            onClick={() => setShown(log.length)}
            className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            {t(locale, "mac.skip")}
          </button>
        </div>
      )}
    </div>
    {done && afterDone ? <div className="mt-4">{afterDone}</div> : null}
    </>
  );
}
