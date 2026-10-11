"use client";

/**
 * Sıradaki turnuva göstergesi — gerçek saat (GMT / dünya saati) + canlı geri sayım.
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
  worldDay: number;
  qualified: boolean;
  requirement: string;
}

const TZ = "UTC"; // oyun zamanı GMT (dünya saati); oyuncu kendi yerel saatine çevirir

function hhmmGMT(ms: number): string {
  return new Date(ms).toLocaleTimeString("tr-TR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}

/** GMT takvim günü anahtarı (YYYY-MM-DD) — "Bugün/Yarın" kararı dünya (GMT) tarihine göre verilir. */
function dateKeyGMT(ms: number): string {
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

/** Turnuva seviyesine göre renk (kullanıcı 11.10): İl→yeşil, Türkiye→kırmızı, Open→nötr, Satellite→mavi,
 * Avrupa→mor, Grand Prix→amber, Dünya Kupası→altın. `bar` = sol şerit/tint, `tag` = etiket çerçeve+yazı. */
const LEVEL_COLOR: Record<string, { bar: string; tag: string }> = {
  IL: { bar: "bg-emerald-500", tag: "border-emerald-500/40 text-emerald-400" },
  TURKIYE: { bar: "bg-rose-500", tag: "border-rose-500/40 text-rose-400" },
  OPEN: { bar: "bg-slate-500", tag: "border-line text-steel" },
  SATELLITE: { bar: "bg-sky-500", tag: "border-sky-500/40 text-sky-400" },
  EUROPEAN: { bar: "bg-violet-500", tag: "border-violet-500/40 text-violet-400" },
  GRAND_PRIX: { bar: "bg-amber-500", tag: "border-amber-500/40 text-amber-400" },
  WORLD_CUP: { bar: "bg-yellow-400", tag: "border-yellow-400/50 text-yellow-300" },
};
export function levelColor(level: string): { bar: string; tag: string } {
  return LEVEL_COLOR[level] ?? { bar: "bg-ink", tag: "border-line text-ink" };
}

/** Turnuva seviyesi etiketi (İL / TR / OPEN …) — seviyeye göre renkli çerçeve/yazı. */
export function LevelTag({ level, locale }: { level: string; locale: Locale }) {
  return (
    <span className={`kicker inline-flex items-center rounded-md border px-1.5 py-0.5 ${levelColor(level).tag}`}>
      {t(locale, `levelTag.${level}`)}
    </span>
  );
}

export function NextTournament({
  info,
  variant,
  locale,
  registered,
  registerHref = "/kariyer/turnuvalar",
}: {
  info: NextTournamentInfo;
  variant: "card" | "bar";
  locale: Locale;
  registered?: boolean;
  /** "Kaydol" nereye götürsün (Turnuvalar sayfasının kendisinde: listedeki yere kaydırır). */
  registerHref?: string;
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

  const hhmm = hhmmGMT(info.startMs);
  // Etiket gerçek GMT takvimine göre ("Bugün/Yarın"); gün 00:00 GMT'de döner.
  const dayLabel =
    now == null
      ? info.dayName // SSR / mount öncesi: nötr (oyun günü adı)
      : dateKeyGMT(info.startMs) === dateKeyGMT(now)
        ? t(locale, "time.today")
        : dateKeyGMT(info.startMs) === dateKeyGMT(now + 86_400_000)
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
        ) : registered && info.isToday && !openNow ? (
          // 06.10 kuralı: bugünün turnuvasında kayıtlı taktik 18:00 GMT'ye kadar değişebilir.
          <Link href={registerHref} className="btn-ghost press shrink-0">
            <span className="lamp lamp-prio h-2.5 w-2.5" aria-hidden="true" />
            {t(locale, "tour.changeTactic")}
          </Link>
        ) : registered ? (
          <span className="flex min-h-11 items-center gap-2 text-[14px] font-semibold">
            <span className="lamp lamp-prio h-2.5 w-2.5" aria-hidden="true" />
            {t(locale, "next.registered")}
          </span>
        ) : info.isToday ? (
          // Bugünün turnuvasına yeni kayıt gün-00:00'da kapandı — "Kaydol" kapalı bir kayda götürmesin.
          <span className="max-w-[45%] text-right text-[13px] text-steel">{t(locale, "turnuvalar.todayClosed")}</span>
        ) : (
          <Link href={registerHref} className="btn-ink press shrink-0">
            {t(locale, "next.register")}
            <Icon name="chevron-right" size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}
