"use client";

/**
 * Maç gösterimi iki kipte:
 * - Canlı (past=false, autoPlay): maç o an oynanıyor — anlatım satır satır gecikmeyle akar (GDD 18.54).
 *   `instantThrough` ile ÖNCEKİ periyotlar anında görünür, yalnız O ANKİ periyot animasyonla akar →
 *   sayfa tazelenince "baştan sarma" olmaz (yeni periyot geldikçe oraya atlar). Kontrol yok (otomatik).
 * - Geçmiş (past=true): maç bitmiş — skor doğrudan görünür; "Skor detayı" ile tuş-tuş döküm açılır.
 * Taraf renkleri eskrim cihazı gibi: A = sol = kırmızı, B = sağ = yeşil (iyi/kötü anlamı yok).
 */
import { useEffect, useState, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { ScoreBug } from "@/app/ui/ScoreBug";
import { whiteLampSide } from "@/app/ui/liveBand";
import { LogLines, SideScore, lastRevealedScore, periodBand, scoringSide } from "../canli/matchParts";

export interface CanliMacProps {
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
  autoPlay?: boolean; // canlı ekranda o an oynanan maç kendiliğinden akar
  past?: boolean; // geçmiş/bitmiş maç → canlı izleme yerine skor + açılır detay
  afterDone?: ReactNode; // animasyon bitince gösterilir (ör. "pul sonuçlarını gör" paneli — spoiler önler)
  instantThrough?: number; // bu indeksten öncesi anında görünür (yalnız o anki periyodu animasyonla göster)
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
  // Canlı: izlenen periyotlar anında (instantThrough), gerisi animasyonla. Canlı-değil-autoPlay = hepsi açık.
  const [shown, setShown] = useState(past ? 0 : autoPlay ? instantThrough : log.length);
  const [detail, setDetail] = useState(false);

  const live = !past;
  // Devam eden maçta önceki periyotlar ANINDA görünür (floor = instantThrough); yalnız o anki periyot animasyonla
  // akar. `revealed` türetilir (state'i effect içinde İTMEYİZ) → yeni periyot gelince baştan sarma olmadan ilerler.
  const floor = autoPlay ? Math.min(instantThrough, log.length) : 0;
  const revealed = Math.max(shown, floor);
  const started = revealed > 0 || autoPlay;
  const done = revealed >= log.length && started;
  const aWon = scoreA >= scoreB;

  // #42: yalnız O ANKİ periyodun satırları animasyonla akar; okunur tempoya (~50 sn) yayılır (satır başına 1.8–3.8 sn).
  const animatingLines = Math.max(1, log.length - floor);
  const stepMs = Math.min(3800, Math.max(1800, Math.round(50000 / animatingLines)));
  useEffect(() => {
    if (!live || !autoPlay || revealed >= log.length) return;
    const id = setTimeout(() => setShown(revealed + 1), stepMs);
    return () => clearTimeout(id);
  }, [live, autoPlay, revealed, stepMs, log.length]);

  // Geçmiş maç: skor açık; "Skor detayı" tuş-tuş dökümü açar (canlı tekrar yok — NOTLAR #47).
  if (!live) {
    return (
      <div className="panel">
        <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-[14px]">
          <span className={`min-w-0 truncate ${aWon ? "font-semibold" : "text-steel"}`}>{aName}</span>
          <SideScore a={scoreA} b={scoreB} />
          <span className={`min-w-0 truncate text-right ${!aWon ? "font-semibold" : "text-steel"}`}>{bName}</span>
        </div>
        <div className="border-t border-line text-[13px] text-steel">
          <button
            type="button"
            onClick={() => setDetail((d) => !d)}
            aria-expanded={detail}
            className="flex min-h-11 w-full items-center justify-center gap-1"
          >
            {t(locale, "mac.detail")}
            <Icon name="chevron-down" size={15} className={`transition-transform ${detail ? "rotate-180" : ""}`} />
          </button>
        </div>
        {detail && (
          <ul className="space-y-0.5 border-t border-line px-3 py-2 text-[13px] text-steel">
            {log.map((line, i) =>
              line.startsWith("⚪") ? (
                <li key={i} className="my-1 flex items-center gap-1.5 rounded-md bg-arena-2 px-2 py-1 font-medium text-ink">
                  <span className="lamp lamp-white h-2 w-2 shrink-0" aria-hidden="true" />
                  {line}
                </li>
              ) : (
                <li key={i}>{line}</li>
              ),
            )}
          </ul>
        )}
      </div>
    );
  }

  const s = done ? { a: scoreA, b: scoreB } : started ? lastRevealedScore(log.slice(0, revealed)) : null;

  // Canlı maç: üstte skor bandı (lamba/juice), altında o anki periyot satır satır akar. Kontrol yok (otomatik).
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
          flash={started && !done ? scoringSide(log, revealed) : undefined}
          white={started && !done ? whiteLampSide(log, revealed, aName, bName) : undefined}
          hitFx
          band={started ? periodBand(locale, log, revealed) : undefined}
        />
        {started && <LogLines log={log} shown={revealed} live={!done} />}
      </div>
      {done && afterDone ? <div className="mt-3">{afterDone}</div> : null}
    </>
  );
}
