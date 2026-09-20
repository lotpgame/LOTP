"use client";

/**
 * Maç gösterimi iki kipte:
 * - Canlı (past=false): maç o an oynanıyor — anlatım satır satır gecikmeyle akar, sonuç
 *   izlenene kadar gizli (GDD 18.54, 18.70). CM 00/01 / Hattrick tarzı.
 * - Geçmiş (past=true): maç bitmiş — skor doğrudan görünür; "📋 Skor detayı" ile tuş-tuş
 *   döküm açılıp kapanır (canlı izleme yerine, kullanıcı isteği).
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
function ScoreBox({ a, b }: { a: number | null; b: number | null }) {
  return (
    <span className="shrink-0 tabular-nums font-bold">
      <span className="text-emerald-600 dark:text-emerald-400">{a ?? "•"}</span>
      <span className="mx-1 opacity-40">–</span>
      <span className="text-red-600 dark:text-red-400">{b ?? "•"}</span>
    </span>
  );
}

export interface CanliMacProps {
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
  autoPlay?: boolean; // canlı ekranda yeni oynanan maç kendiliğinden akar
  past?: boolean; // geçmiş/bitmiş maç → canlı izleme yerine skor + açılır detay
  afterDone?: ReactNode; // animasyon bitince gösterilir (ör. "pul sonuçlarını gör" paneli — spoiler önler)
  instantThrough?: number; // bu indeksten öncesi anında görünür (yalnız son periyodu animasyonla göster)
  locale?: Locale;
}

export function CanliMac({
  aName,
  bName,
  scoreA,
  scoreB,
  log,
  autoPlay = false,
  past = false,
  afterDone,
  instantThrough = 0,
  locale = "tr",
}: CanliMacProps) {
  const [shown, setShown] = useState(autoPlay ? instantThrough : 0);
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
          <ScoreBox a={scoreA} b={scoreB} />
          <span className={`min-w-0 truncate text-right ${!aWon ? "font-semibold" : "opacity-80"}`}>{bName}</span>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-center gap-1 border-t border-black/5 px-3 py-1.5 text-xs opacity-60 transition hover:opacity-100 dark:border-white/10"
        >
          {t(locale, "mac.detail")} {open ? "▴" : "▾"}
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
    <>
    <div className="rounded-lg border border-black/10 p-3 dark:border-white/15">
      <div className="flex items-center justify-between text-sm">
        <span className={done && aWon ? "font-semibold" : "opacity-80"}>{aName}</span>
        {done ? (
          <ScoreBox a={scoreA} b={scoreB} />
        ) : started ? (
          (() => {
            const s = lastRevealedScore(log.slice(0, shown));
            return <ScoreBox a={s?.a ?? null} b={s?.b ?? null} />;
          })()
        ) : (
          <span className="tabular-nums opacity-60">vs</span>
        )}
        <span className={done && !aWon ? "font-semibold" : "opacity-80"}>{bName}</span>
      </div>

      {!started && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={start}
            className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-emerald-500"
          >
            {t(locale, "mac.watch")}
          </button>
          <button
            onClick={() => setShown(log.length)}
            className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            {t(locale, "mac.result")}
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
                  {fast ? t(locale, "mac.normal") : t(locale, "mac.fast")}
                </button>
                <button
                  onClick={() => setShown(log.length)}
                  className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
                >
                  {t(locale, "mac.skip")}
                </button>
              </>
            ) : (
              <button
                onClick={start}
                className="rounded-md border border-black/15 px-3 py-1 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20"
              >
                {t(locale, "mac.rewatch")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
    {done && afterDone ? <div className="mt-3">{afterDone}</div> : null}
    </>
  );
}
