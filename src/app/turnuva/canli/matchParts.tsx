"use client";

/**
 * Canlı maç gösterimlerinin ortak parçaları (CanliPeriyot + CanliMac).
 * Log satırlarındaki skor "A–B" sırasındadır; A = sol (kırmızı), B = sağ (yeşil).
 */
import { t, type Locale } from "@/i18n";

/** Açıklanan son tuş satırından güncel skoru sayı çifti olarak çıkarır ("… 3–2" → {a:3,b:2}). */
export function lastRevealedScore(lines: string[]): { a: number; b: number } | null {
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/(\d+)\s*[–-]\s*(\d+)/);
    if (m) return { a: Number(m[1]), b: Number(m[2]) };
  }
  return null;
}

/** Son açılan satırda hangi tarafın skoru arttı? → o tarafın lambası yanıp söner (epede çift tuş: ikisi). */
export function scoringSide(log: string[], shown: number): "left" | "right" | "both" | undefined {
  if (shown <= 0) return undefined;
  const now = lastRevealedScore(log.slice(0, shown));
  const before = lastRevealedScore(log.slice(0, shown - 1)) ?? { a: 0, b: 0 };
  if (!now) return undefined;
  if (now.a > before.a && now.b > before.b) return "both";
  if (now.a > before.a) return "left";
  if (now.b > before.b) return "right";
  return undefined;
}

/** Anlatım satırları: en yeni satır belirgin (sol çizgi, tuşu alan tarafın renginde), eskiler soluk. */
export function LogLines({ log, shown, live }: { log: string[]; shown: number; live: boolean }) {
  const side = live ? scoringSide(log, shown) : undefined;
  const edge = side === "left" ? "border-sig-red" : side === "right" ? "border-sig-green" : "border-ink";
  return (
    <ul className="mt-3 space-y-1 text-[14px]">
      {log.slice(0, shown).map((line, i) => {
        const newest = live && i === shown - 1;
        const header = line.startsWith("▸");
        return (
          <li
            key={i}
            className={
              newest
                ? `border-l-2 ${edge} pl-2 font-medium text-ink`
                : header
                  ? "kicker pt-1"
                  : "pl-2.5 text-steel"
            }
          >
            {line}
          </li>
        );
      })}
    </ul>
  );
}

/** Hızlı / Atla — 44 px segment. */
export function SpeedControl({
  locale,
  fast,
  onFast,
  onSkip,
}: {
  locale: Locale;
  fast: boolean;
  onFast: (v: boolean) => void;
  onSkip: () => void;
}) {
  return (
    <div className="mt-3 flex rounded-md border border-line p-0.5">
      <button
        type="button"
        onClick={() => onFast(!fast)}
        aria-pressed={fast}
        className={`flex min-h-11 flex-1 items-center justify-center rounded-[5px] text-[14px] ${fast ? "bg-ink font-semibold text-arena-0" : "text-steel"}`}
      >
        {t(locale, "mac.fast")}
      </button>
      <button type="button" onClick={onSkip} className="flex min-h-11 flex-1 items-center justify-center rounded-[5px] text-[14px] text-steel">
        {t(locale, "mac.skip")}
      </button>
    </div>
  );
}

/** Bitmiş maç skoru (satır içi): sol kırmızı, sağ yeşil; kazananı kalınlık söyler. */
export function SideScore({ a, b }: { a: number | null; b: number | null }) {
  return (
    <span className="num shrink-0 text-[15px]">
      <span className="text-sig-red">{a ?? "•"}</span>
      <span className="mx-1 text-steel">–</span>
      <span className="text-sig-green">{b ?? "•"}</span>
    </span>
  );
}
