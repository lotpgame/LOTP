"use client";

/**
 * Maç gösterimi iki kipte:
 * - Canlı (past=false): maç o an oynanıyor — anlatım satır satır gecikmeyle akar, sonuç
 *   izlenene kadar gizli (GDD 18.54, 18.70). CM 00/01 / Hattrick tarzı. Üstte skor bandı.
 * - Geçmiş (past=true): maç bitmiş — skor doğrudan görünür; "Skor detayı" ile tuş-tuş döküm açılır.
 * Taraf renkleri eskrim cihazı gibi: A = sol = kırmızı, B = sağ = yeşil (iyi/kötü anlamı yok).
 */
import { useEffect, useState, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { ScoreBug } from "@/app/ui/ScoreBug";
import { LogLines, SideScore, SpeedControl, lastRevealedScore, scoringSide } from "../canli/matchParts";

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
  youSide?: "left" | "right"; // oyuncu hangi tarafta (SEN etiketi); verilmezse etiket yok
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
  youSide,
  locale = "tr",
}: CanliMacProps) {
  const [shown, setShown] = useState(autoPlay ? instantThrough : 0);
  const [playing, setPlaying] = useState(autoPlay);
  const [fast, setFast] = useState(false);

  const started = shown > 0 || playing;
  const done = shown >= log.length && started;
  const aWon = scoreA >= scoreB;

  // Bir sonraki satırı gecikmeyle açar; bittiğinde durur (setState zamanlayıcı içinde → güvenli).
  useEffect(() => {
    if (past || !playing || shown >= log.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), fast ? 250 : 800);
    return () => clearTimeout(id);
  }, [past, playing, shown, fast, log.length]);

  // Geçmiş maç: skor açık, "Skor detayı" ile tuş-tuş döküm açılır (native details, JS gerekmez).
  if (past) {
    return (
      <div className="panel">
        <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-[14px]">
          <span className={`min-w-0 truncate ${aWon ? "font-semibold" : "text-steel"}`}>{aName}</span>
          <SideScore a={scoreA} b={scoreB} />
          <span className={`min-w-0 truncate text-right ${!aWon ? "font-semibold" : "text-steel"}`}>{bName}</span>
        </div>
        <details className="group border-t border-line">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 text-[13px] text-steel [&::-webkit-details-marker]:hidden">
            {t(locale, "mac.detail")}
            <Icon name="chevron-down" size={15} className="transition-transform group-open:rotate-180" />
          </summary>
          <ul className="space-y-0.5 border-t border-line px-3 py-2 text-[13px] text-steel">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </details>
      </div>
    );
  }

  const start = () => {
    setShown(0);
    setPlaying(true);
  };

  const s = done ? { a: scoreA, b: scoreB } : started ? lastRevealedScore(log.slice(0, shown)) : null;

  return (
    <>
      <div className="panel p-3">
        <ScoreBug
          className={started ? "sticky top-2 z-10" : ""}
          left={aName}
          right={bName}
          scoreL={s?.a ?? 0}
          scoreR={s?.b ?? 0}
          youSide={youSide}
          youLabel={t(locale, "live.you")}
          flash={started && !done ? scoringSide(log, shown) : undefined}
        />

        {!started && (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={start} className="btn-ink press flex-1">
              {t(locale, "mac.watch")}
            </button>
            <button type="button" onClick={() => setShown(log.length)} className="btn-ghost press flex-1">
              {t(locale, "mac.result")}
            </button>
          </div>
        )}

        {started && (
          <>
            <LogLines log={log} shown={shown} live={!done} />
            {!done ? (
              <SpeedControl locale={locale} fast={fast} onFast={setFast} onSkip={() => setShown(log.length)} />
            ) : (
              <button type="button" onClick={start} className="btn-ghost press mt-3 w-full">
                {t(locale, "mac.rewatch")}
              </button>
            )}
          </>
        )}
      </div>
      {done && afterDone ? <div className="mt-3">{afterDone}</div> : null}
    </>
  );
}
