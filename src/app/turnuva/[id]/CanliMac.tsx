"use client";

/**
 * Maç gösterimi iki kipte:
 * - Canlı (past=false): maç o an oynanıyor — anlatım satır satır gecikmeyle akar, sonuç
 *   izlenene kadar gizli (GDD 18.54, 18.70). CM 00/01 / Hattrick tarzı.
 * - Geçmiş (past=true): maç bitmiş — skor doğrudan görünür; "📋 Skor detayı" ile tuş-tuş
 *   döküm açılıp kapanır (canlı izleme yerine, kullanıcı isteği).
 */
import { useEffect, useState, type ReactNode } from "react";

export interface CanliMacProps {
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
  autoPlay?: boolean; // canlı ekranda yeni oynanan maç kendiliğinden akar
  past?: boolean; // geçmiş/bitmiş maç → canlı izleme yerine skor + açılır detay
  afterDone?: ReactNode; // animasyon bitince gösterilir (ör. "pul sonuçlarını gör" paneli — spoiler önler)
}

export function CanliMac({ aName, bName, scoreA, scoreB, log, autoPlay = false, past = false, afterDone }: CanliMacProps) {
  const [shown, setShown] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  const [fast, setFast] = useState(false);
  const [open, setOpen] = useState(false); // geçmiş kipinde detay açık mı

  const started = shown > 0 || playing;
  const done = shown >= log.length && started;
  const aWon = scoreA >= scoreB;

  // Bir sonraki satırı gecikmeyle açar; bittiğinde durur (setState zamanlayıcı içinde → güvenli).
  useEffect(() => {
    if (past || !playing || shown >= log.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), fast ? 250 : 800);
    return () => clearTimeout(id);
  }, [past, playing, shown, fast, log.length]);

  // Geçmiş maç: skor açık, "Skor detayı" ile tuş-tuş döküm açılır.
  if (past) {
    return (
      <div className="rounded-lg border border-black/10 dark:border-white/15">
        <div className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
          <span className={`min-w-0 truncate ${aWon ? "font-semibold" : "opacity-80"}`}>{aName}</span>
          <span className="shrink-0 tabular-nums font-semibold">
            {scoreA} – {scoreB}
          </span>
          <span className={`min-w-0 truncate text-right ${!aWon ? "font-semibold" : "opacity-80"}`}>{bName}</span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-1 border-t border-black/5 px-3 py-1.5 text-xs opacity-60 transition hover:opacity-100 dark:border-white/10"
        >
          📋 Skor detayı {open ? "▴" : "▾"}
        </button>
        {open && (
          <ul className="space-y-0.5 border-t border-black/5 px-3 py-2 text-xs opacity-80 dark:border-white/10">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

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
      {done && afterDone && <div className="mt-3">{afterDone}</div>}
    </div>
  );
}
