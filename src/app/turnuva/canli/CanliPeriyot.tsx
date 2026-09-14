"use client";

/**
 * Devam eden insan eleme maçının o anki periyodunu satır satır akıtır (GDD 18.54).
 * Önceki periyotlar (instantThrough'a kadar) anında görünür; yalnız yeni periyot animasyonla akar.
 * Bileşen her yeni periyotta remount edilir (page'de key={log.length}) → shown doğru başlar.
 */
import { useEffect, useState, type ReactNode } from "react";

export interface CanliPeriyotProps {
  aName: string;
  oppName: string;
  scoreHuman: number;
  scoreOpp: number;
  log: string[];
  instantThrough: number; // bu indeksten öncesi anında gösterilir
  afterDone?: ReactNode; // periyot animasyonu bitince gösterilir (devre arası paneli — spoiler önler)
}

export function CanliPeriyot({ aName, oppName, scoreHuman, scoreOpp, log, instantThrough, afterDone }: CanliPeriyotProps) {
  const [shown, setShown] = useState(instantThrough);
  const [fast, setFast] = useState(false);
  const done = shown >= log.length;

  useEffect(() => {
    if (shown >= log.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), fast ? 250 : 800);
    return () => clearTimeout(id);
  }, [shown, fast, log.length]);

  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{aName} (sen)</span>
        {/* Skor animasyon bitene kadar gizli (spoiler önler); tuş satırları zaten skoru gösterir. */}
        <span className="tabular-nums font-semibold">{done ? `${scoreHuman} – ${scoreOpp}` : "• • •"}</span>
        <span className="opacity-80">{oppName}</span>
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
            {fast ? "Normal hız" : "Hızlı"}
          </button>
          <button
            onClick={() => setShown(log.length)}
            className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            Atla ⏭
          </button>
        </div>
      )}
      {done && afterDone && <div className="mt-4">{afterDone}</div>}
    </div>
  );
}
