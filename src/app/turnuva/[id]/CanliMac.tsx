"use client";

/**
 * Canlı maç izleme (GDD 18.54, 18.70) — CM 00/01 / Hattrick tarzı: maç anlatımı satır satır,
 * gecikmeyle akar; sonuç izlenene kadar gizli (spoiler yok). Kayıtlı combat log'unu oynatır.
 */
import { useEffect, useState } from "react";

export interface CanliMacProps {
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
  autoPlay?: boolean; // canlı ekranda yeni oynanan maç kendiliğinden akar
}

export function CanliMac({ aName, bName, scoreA, scoreB, log, autoPlay = false }: CanliMacProps) {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [fast, setFast] = useState(false);

  const started = shown > 0 || playing;
  const done = shown >= log.length && started;
  const aWon = scoreA >= scoreB;

  // Bir sonraki satırı gecikmeyle açar; bittiğinde durur (setState zamanlayıcı içinde → güvenli).
  useEffect(() => {
    if (!playing || shown >= log.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), fast ? 450 : 1300);
    return () => clearTimeout(id);
  }, [playing, shown, fast, log.length]);

  const start = () => {
    setShown(0);
    setPlaying(true);
  };

  return (
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center justify-between text-sm">
        <span className={done && aWon ? "font-semibold" : "opacity-80"}>{aName}</span>
        <span className="tabular-nums">
          {done ? `${scoreA} – ${scoreB}` : started ? "• • •" : "vs"}
        </span>
        <span className={done && !aWon ? "font-semibold" : "opacity-80"}>{bName}</span>
      </div>

      {!started && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={start}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            ▶ Canlı İzle
          </button>
          <button
            onClick={() => setShown(log.length)}
            className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            Sonucu Gör
          </button>
        </div>
      )}

      {started && (
        <>
          <ul className="mt-2 space-y-0.5 text-xs opacity-80">
            {log.slice(0, shown).map((line, i) => (
              <li key={i} className={i === shown - 1 && !done ? "text-emerald-600" : ""}>
                {line}
              </li>
            ))}
          </ul>
          <div className="mt-2 flex gap-2">
            {!done ? (
              <>
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
              </>
            ) : (
              <button
                onClick={start}
                className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
              >
                ↺ Tekrar izle
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
