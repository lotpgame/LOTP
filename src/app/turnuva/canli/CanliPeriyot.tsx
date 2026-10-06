"use client";

/**
 * Devam eden insan eleme maçının o anki periyodunu satır satır akıtır (GDD 18.54).
 * Önceki periyotlar (instantThrough'a kadar) anında görünür; yalnız yeni periyot animasyonla akar.
 * Bileşen her yeni periyotta remount edilir (page'de key={log.length}) → shown doğru başlar.
 * Skor bandı eskrim cihazı gibi: oyuncu SOLDA = KIRMIZI, rakip sağda = yeşil (renk iyi/kötü değil).
 */
import { useEffect, useState, type ReactNode } from "react";
import { t, type Locale } from "@/i18n";
import { ScoreBug } from "@/app/ui/ScoreBug";
import { whiteLampSide } from "@/app/ui/liveBand";
import { LogLines, SpeedControl, lastRevealedScore, periodBand, scoringSide } from "./matchParts";

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

  // Skor yalnız satır açıldıkça değişir (spoiler yok); biten periyotta kesin skor.
  const s = done ? { a: scoreHuman, b: scoreOpp } : lastRevealedScore(log.slice(0, shown));
  const flash = done ? undefined : scoringSide(log, shown);

  return (
    <>
      <div className="panel p-3">
        <ScoreBug
          className="sticky top-2 z-10"
          left={aName}
          right={oppName}
          scoreL={s?.a ?? 0}
          scoreR={s?.b ?? 0}
          youSide="left"
          youLabel={t(locale, "live.you")}
          flash={flash}
          white={done ? undefined : whiteLampSide(log, shown, aName, oppName)}
          hitFx
          band={periodBand(locale, log, shown)}
        />
        <LogLines log={log} shown={shown} live={!done} />
        {!done && <SpeedControl locale={locale} fast={fast} onFast={setFast} onSkip={() => setShown(log.length)} />}
      </div>
      {done && afterDone ? <div className="mt-4">{afterDone}</div> : null}
    </>
  );
}
