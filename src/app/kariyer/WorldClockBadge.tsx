"use client";

/**
 * Oyun saati rozeti (yatay üst şerit sağı/solu) — canlı GMT tarih + saat. Tıklanınca öne bir pencere açılır
 * (kullanıcı kararı 15.11): büyük GMT saati + açıklama + oyuncunun KENDİ yerel saati & zaman dilimi.
 * Oyun dünyası GMT (Greenwich) referanslıdır; farklı ülkedeki oyuncu bu saati kendi yereline çevirir
 * (CLAUDE.md saat kuralı). Tarih/saat tarayıcıda canlı GMT'den ve yerelden okunur.
 */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

interface ClockParts {
  gmtDate: string;
  gmtTime: string;
  localTime: string;
  zone: string;
  offset: string;
}

function readParts(locale: Locale): ClockParts {
  const now = new Date();
  const gmtDate = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(now);
  const gmtTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "UTC" }).format(now);
  const localTime = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  let zone = "";
  try {
    zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  } catch {
    zone = "";
  }
  // Yerelin GMT'den farkı (ör. GMT+3). getTimezoneOffset dakika cinsinden ve ters işaretli.
  const h = -now.getTimezoneOffset() / 60;
  const offset = `GMT${h >= 0 ? "+" : "−"}${Math.abs(h) % 1 === 0 ? Math.abs(h) : Math.abs(h).toFixed(1)}`;
  return { gmtDate, gmtTime, localTime, zone, offset };
}

export function WorldClockBadge({ locale }: { locale: Locale }) {
  // Sunucu/ilk render'da boş; hydration sonrası doldur (SSR-client saat uyuşmazlığını önler).
  const [p, setP] = useState<ClockParts>({ gmtDate: "", gmtTime: "", localTime: "", zone: "", offset: "" });
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const tick = () => setP(readParts(locale));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [locale]);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const close = () => dialog.current?.close();

  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        aria-haspopup="dialog"
        aria-label={t(locale, "clock.title")}
        className="press flex select-none flex-col items-end justify-center pr-2 pl-1 text-right leading-tight"
      >
        <span className="num whitespace-nowrap text-[11px] text-steel">{p.gmtDate || " "}</span>
        <span className="num whitespace-nowrap text-[13px] font-semibold tabular-nums text-ink">
          {p.gmtTime || "--:--"} <span className="text-[10px] font-normal text-steel">GMT</span>
        </span>
      </button>

      {mounted &&
        createPortal(
          <dialog
            ref={dialog}
            className="modal"
            aria-label={t(locale, "clock.title")}
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
          >
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-[19px] font-bold">
                  <Icon name="clock" size={18} className="text-steel" /> {t(locale, "clock.title")}
                </span>
                <button type="button" onClick={close} className="-mr-2 flex h-11 w-11 items-center justify-center text-steel" aria-label={t(locale, "common.close")}>
                  <Icon name="close" />
                </button>
              </div>

              {/* Büyük GMT saati (oyun dünyası referansı) */}
              <div className="rounded-lg border border-line bg-arena-1 p-4 text-center">
                <div className="num text-[44px] font-bold leading-none tabular-nums">{p.gmtTime || "--:--"}</div>
                <div className="mt-1 text-[13px] font-semibold tracking-wide text-steel">GMT · {p.gmtDate}</div>
              </div>

              {/* Oyuncunun kendi yerel saati + zaman dilimi */}
              <div className="mt-3 flex items-center justify-between rounded-lg border border-line px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[13px] text-steel">{t(locale, "clock.local")}</div>
                  <div className="truncate text-[14px]">
                    {p.zone || "—"} <span className="text-steel">({p.offset})</span>
                  </div>
                </div>
                <div className="num shrink-0 text-[24px] font-bold tabular-nums">{p.localTime || "--:--"}</div>
              </div>

              <p className="mt-3 text-[13px] leading-relaxed text-steel">{t(locale, "clock.note")}</p>
            </div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
