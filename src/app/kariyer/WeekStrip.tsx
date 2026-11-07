/**
 * 7 günlük hafta şeridi (Bugün + Turnuvalar). Turnuva günü = kısa seviye etiketi + kayıt işareti; antrenman
 * günü = plandaki seansın ikonu. Hücreye dokununca ilgili sayfaya gider (turnuva → kayıt listesi, antrenman → plan).
 * Bugün: mürekkep çerçeve + kırmızı "en-garde" çizgisi (menüdeki aktif sayfa ile aynı dil).
 */
import Link from "next/link";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { trainingImg } from "./trainingImage";
import type { WeekDay } from "./week";

function statusKey(d: WeekDay): string {
  if (d.kind === "TRAINING") return "";
  if (d.qualified === false) return "week.locked";
  if (d.registered) return "week.registered";
  return d.today ? "" : "week.open";
}

export function WeekStrip({ days, locale, countryCode }: { days: WeekDay[]; locale: Locale; countryCode?: string }) {
  const anyLocked = days.some((d) => statusKey(d) === "week.locked");
  return (
    <section aria-labelledby="hafta-seridi">
      <h2 id="hafta-seridi" className="kicker mb-2">
        {t(locale, "week.title")}
      </h2>
      <ol className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const st = statusKey(d);
          const what = d.kind === "TOURNAMENT" ? (d.label ?? t(locale, `levelTag.${d.level}`)) : t(locale, `training.${d.training}`);
          const aria = [t(locale, `day.${d.dow}`), d.today ? t(locale, "week.today") : "", what, st ? t(locale, st) : ""].filter(Boolean).join(" · ");
          return (
            <li key={d.worldDay}>
              <Link
                href={d.kind === "TOURNAMENT" ? "/kariyer/turnuvalar#yaklasan" : "/kariyer/antrenman"}
                aria-label={aria}
                className={`panel press relative flex min-h-[4.75rem] flex-col items-center justify-between overflow-hidden px-0.5 pt-1.5 pb-2 ${
                  d.today ? "border-ink bg-arena-0" : ""
                }`}
              >
                <span className={`text-[12px] leading-none ${d.today ? "font-bold text-ink" : "font-semibold text-ink/80"}`}>
                  {t(locale, `dayShort.${d.dow}`)}
                </span>
                {d.kind === "TOURNAMENT" ? (
                  <span className="kicker rounded border border-ink/60 px-1 py-px text-[10px] leading-tight text-ink">
                    {d.level === "TURKIYE" && countryCode ? countryCode : t(locale, `levelShort.${d.level}`)}
                  </span>
                ) : (
                  <img src={trainingImg(d.training ?? "REST")} alt="" aria-hidden="true" className="object-contain" style={{ width: 22, height: 22 }} />
                )}
                <span className="flex h-3.5 items-center" aria-hidden="true">
                  {st === "week.registered" && <Icon name="check" size={14} className="text-ink" />}
                  {st === "week.open" && <span className="h-2 w-2 rounded-full border border-steel" />}
                  {st === "week.locked" && <Icon name="lock" size={12} className="text-steel" />}
                </span>
                {d.today && <span className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-sig-red" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-steel">
        <span className="inline-flex items-center gap-1">
          <Icon name="check" size={14} className="text-ink" /> {t(locale, "week.registered")}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-steel" aria-hidden="true" /> {t(locale, "week.open")}
        </span>
        {anyLocked && (
          <span className="inline-flex items-center gap-1">
            <Icon name="lock" size={12} /> {t(locale, "week.locked")}
          </span>
        )}
        <span>{t(locale, "week.trainingHint")}</span>
      </p>
    </section>
  );
}
