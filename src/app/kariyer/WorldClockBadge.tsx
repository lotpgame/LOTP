"use client";

/**
 * Oyun saati rozeti (yatay üst şerit sağı) — SADECE canlı GMT tarih + saat gösterir, tıklanmaz.
 * Oyun dünyası GMT (Greenwich) referanslıdır; farklı ülkedeki oyuncu bu canlı saati görüp kendi
 * yerel saatine çevirir (CLAUDE.md saat kuralı). Tarih de saat de tarayıcıda canlı GMT'den okunur.
 */
import { useEffect, useState } from "react";
import type { Locale } from "@/i18n";

function gmtParts(locale: Locale): { date: string; time: string } {
  const now = new Date();
  const date = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(now);
  return { date, time };
}

export function WorldClockBadge({ locale }: { locale: Locale }) {
  // Sunucu/ilk render'da boş; hydration sonrası doldur (SSR-client saat uyuşmazlığını önler).
  const [p, setP] = useState<{ date: string; time: string }>({ date: "", time: "" });
  useEffect(() => {
    const tick = () => setP(gmtParts(locale));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [locale]);

  return (
    <div className="flex select-none flex-col items-end justify-center pr-2 text-right leading-tight" aria-hidden={!p.time}>
      <span className="num whitespace-nowrap text-[11px] text-steel">{p.date || " "}</span>
      <span className="num whitespace-nowrap text-[13px] font-semibold tabular-nums text-ink">
        {p.time || "--:--"} <span className="text-[10px] font-normal text-steel">GMT</span>
      </span>
    </div>
  );
}
