"use client";

/**
 * Sıradaki turnuva göstergesi — gerçek saat (TR saati) + canlı geri sayım.
 * `variant="card"`: Bugün ekranı / Turnuvalar üstündeki kart (seviye etiketi, büyük geri sayım, kayıt lambası).
 * `variant="bar"`: gün çubuğunda tek satırlık ipucu.
 * Geri sayım yalnız istemcide (mount sonrası) hesaplanır → hydration uyumsuzluğu olmaz.
 */
import Link from "next/link";
import { useEffect, useState } from "react";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

export interface NextTournamentInfo {
  level: string;
  label: string;
  dayName: string;
  startMs: number;
  daysUntil: number;
  isToday: boolean;
  qualified: boolean;
  requirement: string;
}

const TZ = "Europe/Istanbul";

function hhmmTR(ms: number): string {
  return new Date(ms).toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** TR takvim günü anahtarı (YYYY-MM-DD) — "Bugün/Yarın" kararı gerçek tarihe göre verilir. */
function dateKeyTR(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: TZ });
}

function weekday(ms: number, locale: Locale): string {
  return new Date(ms).toLocaleDateString(locale === "tr" ? "tr-TR" : locale, { timeZone: TZ, weekday: "long" });
}

function fmtRemaining(ms: number, locale: Locale): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return t(locale, "time.dh", { d, h });
  if (h > 0) return t(locale, "time.hm", { h, m });
  return t(locale, "time.m", { m });
}

/** Turnuva seviyesi etiketi (İL / TR / OPEN …) — çerçeveli, renksiz. */
export function LevelTag({ level, locale }: { level: string; locale: Locale }) {
  return (
    <span className="kicker inline-flex items-center rounded-md border border-line px-1.5 py-0.5 text-ink">
      {t(locale, `levelTag.${level}`)}
    </span>
  );
}

export function NextTournament({
  info,
  variant,
  locale,
  registered,
}: {
  info: NextTournamentInfo;
  variant: "card" | "bar";
  locale: Locale;
  registered?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // İlk değer mount'tan hemen sonra (senkron değil → hydration uyumsuzluğu ve cascade render yok).
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 30_000); // 30 sn'de bir tazele
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const hhmm = hhmmTR(info.startMs);
  // Etiket gerçek TR takvimine göre: gün geçişi akşam olduğu için "sonraki oyun günü" çoğu zaman bu akşamdır.
  const dayLabel =
    now == null
      ? info.dayName // SSR / mount öncesi: nötr (oyun günü adı)
      : dateKeyTR(info.startMs) === dateKeyTR(now)
        ? t(locale, "time.today")
        : dateKeyTR(info.startMs) === dateKeyTR(now + 86_400_000)
          ? t(locale, "time.tomorrow")
          : weekday(info.startMs, locale);
  const openNow = now != null && now >= info.startMs;
  const remaining = now == null ? null : Math.max(0, info.startMs - now);

  if (variant === "bar") {
    return (
      <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-steel">
        <Icon name="tournament" size={15} className="shrink-0" />
        <span className="truncate">
          {info.label} · {dayLabel} <span className="num">{hhmm}</span>
          {!openNow && remaining != null ? ` · ${fmtRemaining(remaining, locale)}` : ""}
        </span>
      </span>
    );
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="kicker">{t(locale, "next.title")}</span>
        <LevelTag level={info.level} locale={locale} />
      </div>
      <div className="mt-2 font-display text-[22px] font-bold leading-tight">{info.label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[14px] text-steel">
        <Icon name="calendar" size={15} />
        {dayLabel} · <span className="num text-ink">{hhmm}</span> {t(locale, "next.trTime")}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        {openNow ? (
          <span className="flex items-center gap-2 text-[15px] font-semibold">
            <span className="lamp lamp-red anim-live h-2.5 w-2.5" aria-hidden="true" />
            {t(locale, "next.openNow")}
          </span>
        ) : (
          <div className="min-w-0">
            <div className="num text-[28px] leading-none">{remaining != null ? fmtRemaining(remaining, locale) : "—"}</div>
            <div className="mt-1 text-[13px] text-steel">{t(locale, "next.left")}</div>
          </div>
        )}

        {!info.qualified ? (
          <span className="flex items-center gap-1.5 text-[13px] text-steel">
            <Icon name="lock" size={15} /> {info.requirement}
          </span>
        ) : registered ? (
          <span className="flex min-h-11 items-center gap-2 text-[14px] font-semibold">
            <span className="lamp lamp-prio h-2.5 w-2.5" aria-hidden="true" />
            {t(locale, "next.registered")}
          </span>
        ) : (
          <Link href="/kariyer/turnuvalar" className="btn-ink press shrink-0">
            {t(locale, "next.register")}
            <Icon name="chevron-right" size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
