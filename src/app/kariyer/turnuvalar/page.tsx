import Link from "next/link";
import { ArenaPage } from "@/app/ArenaPage";
import { redirect } from "next/navigation";
import { attendTournamentAction } from "@/app/actions";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getCareerHeader, getNextTournament, getUpcomingTournaments } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { DenarMark } from "../DenarMark";
import { RegisterDialog } from "./RegisterDialog";
import type { Locale } from "@/i18n";

/** Turnuva ödül etiketi (kapsama göre): Open = tecrübe; diğerleri = "{İl/Ulusal/Dünya klasmanı} + tecrübe". */
function rewardTextFor(locale: Locale, level: string): string {
  if (level === "OPEN") return t(locale, "tour.rewardXp");
  const scope = level === "IL" ? "tour.scopeCity" : level === "TURKIYE" ? "tour.scopeNational" : "tour.scopeWorld";
  return t(locale, "tour.rewardRank", { scope: t(locale, scope) });
}
import { serverWorldDay } from "@/server/world";
import { LevelTag, NextTournament } from "../NextTournament";
import { levelColor } from "../levelColor";
import { WeekStrip } from "../WeekStrip";
import { buildWeek, todayFromHeader } from "../week";
import { ErrorBanner } from "../ErrorBanner";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const { err } = await searchParams;
  const upcoming = await getUpcomingTournaments();
  const next = await getNextTournament();
  const header = await getCareerHeader();
  // #5a: turnuva zamanı geldiyse burada CANLI görünür ve giriş buradan yapılır (alt çubukta Katıl yok).
  const liveNow = header?.canAttend && header.today.kind === "TOURNAMENT" ? header.today : null;
  const nextRegistered = next ? upcoming.find((u) => u.worldDay === next.worldDay)?.registered : undefined;

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);

  return (
    <ArenaPage bg="/img/bg-turnuvalar.webp" className="flex flex-col gap-4">
      <h1 className="display text-[28px]">{t(locale, "turnuvalar.title")}</h1>
      <ErrorBanner code={err} locale={locale} dismissHref="/kariyer/turnuvalar" />

      {/* #5a: turnuva CANLI — giriş buradan. Kırmızı buton değil: mürekkep buton + yanıp sönen lamba. */}
      {liveNow && (
        <section className="panel border-ink p-4">
          <div className="flex items-center gap-2">
            <span className="lamp lamp-red anim-live h-2.5 w-2.5" aria-hidden="true" />
            <span className="kicker text-ink">{t(locale, "tour.live")}</span>
          </div>
          <div className="mt-2 font-display text-[22px] font-bold leading-tight">{liveNow.label}</div>
          <p className="mt-1 text-[14px] text-steel">{t(locale, "tour.liveDesc")}</p>
          <form action={attendTournamentAction} className="mt-3">
            <button className="btn-ink press h-12 w-full text-[16px]">
              {t(locale, "tour.enter")}
              <Icon name="chevron-right" size={18} />
            </button>
          </form>
        </section>
      )}

      {/* Sıradaki turnuva: gerçek saat + canlı geri sayım + kayıt durumu */}
      {!liveNow && next && <NextTournament info={next} variant="card" locale={locale} registered={nextRegistered} registerHref="#yaklasan" country={c.countryCode} />}

      <WeekStrip days={buildWeek(serverWorldDay(), c.trainingPlan, upcoming, todayFromHeader(header, locale))} locale={locale} countryCode={c.countryCode} />

      {/* M10.2: Yaklaşan turnuvalar — önceden kayıt + taktik (ortak dünyada sunucu otomatik oynatır) */}
      <section id="yaklasan" className="scroll-mt-20">
        <h2 className="kicker mb-2">{t(locale, "turnuvalar.upcoming")}</h2>
        {upcoming.length === 0 && <p className="text-[14px] text-steel">{t(locale, "turnuvalar.noneUpcoming")}</p>}
        <ul className="flex flex-col gap-2.5">
          {upcoming.map((u) => (
            <li key={`${u.worldDay}:${u.level}`} className="panel relative overflow-hidden p-3">
              {/* Seviyeye göre renk (kullanıcı 11.10): hafif arka plan tinti + sol şerit (kayıtlıysa kalınlaşır). */}
              <span className={`pointer-events-none absolute inset-0 ${levelColor(u.level).bar} opacity-[0.05]`} aria-hidden="true" />
              <span className={`absolute inset-y-0 left-0 ${u.registered ? "w-1" : "w-[3px]"} ${levelColor(u.level).bar}`} aria-hidden="true" />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{u.label}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-steel">
                    {/* Tarih + saat (18:00 GMT) + "GMT" etiketi → sıradaki kartla tutarlı, yerel sanılmaz (#19). */}
                    <Icon name="calendar" size={14} /> {u.dateLabel} {t(locale, "next.trTime")}
                  </div>
                </div>
                <LevelTag level={u.level} locale={locale} country={c.countryCode} />
              </div>

              {/* #28: bu turnuva ne verir — Open tecrübe, şampiyona klasman puanı */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-line px-1.5 py-0.5 text-[12px] text-steel">
                  {rewardTextFor(locale, u.level)}
                </span>
                {/* Masraf: kayıt + yol/konaklama (ev sahibi şehir kendi şehrinse yol 0 → gizli). */}
                {(u.entryFee > 0 || u.travelCost > 0) && (
                  <span className="flex items-center gap-1 rounded-md border border-line px-1.5 py-0.5 text-[12px] text-steel">
                    {u.entryFee > 0 && (
                      <>
                        {t(locale, "tour.entry")} <DenarMark size={11} /> <span className="num">{u.entryFee}</span>
                      </>
                    )}
                    {u.entryFee > 0 && u.travelCost > 0 && <span aria-hidden="true">·</span>}
                    {u.travelCost > 0 && (
                      <>
                        {t(locale, "tour.travel")} <DenarMark size={11} /> <span className="num">{u.travelCost}</span>
                      </>
                    )}
                  </span>
                )}
                {u.registered && (
                  <span className="flex items-center gap-1 text-[13px] font-semibold">
                    <Icon name="check" size={16} className="anim-check" /> {t(locale, "turnuvalar.registered")} ·{" "}
                    {t(locale, `tactic.${u.tactic}`)}
                  </span>
                )}
              </div>

              {u.isToday && !u.registered ? (
                // Bugünün turnuvası: yeni kayıt gün-00:00'da kapandı (06.10 kuralı) — yalnız kayıtlı taktik değiştirir.
                <p className="mt-3 text-[13px] text-steel">{t(locale, "turnuvalar.todayClosed")}</p>
              ) : u.qualified ? (
                // Kaydol → "resmi fiş" onay penceresi (RegisterDialog): ad + ödül + kayıt/yol masrafı + taktik.
                <div className="mt-3">
                  <RegisterDialog
                    locale={locale}
                    worldDay={u.worldDay}
                    level={u.level}
                    label={u.label}
                    rewardText={rewardTextFor(locale, u.level)}
                    entryFee={u.entryFee}
                    travelCost={u.travelCost}
                    playerCity={c.club?.city ?? ""}
                    defaultTactic={u.tactic}
                    registered={u.registered}
                    isToday={u.isToday}
                    triggerClassName="btn-ghost press w-full"
                  />
                </div>
              ) : (
                <div className="mt-2 flex items-center gap-1.5 text-[13px] text-steel">
                  <Icon name="lock" size={15} /> {u.requirement}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Oynanmış turnuvalar Kariyer Geçmişi'nde */}
      <Link href="/kariyer/gecmis" className="panel flex min-h-12 items-center gap-3 px-4 active:bg-arena-2">
        <Icon name="history" size={20} className="text-steel" />
        <span className="flex-1 text-[15px]">{t(locale, "turnuvalar.pastLink")}</span>
        <Icon name="chevron-right" size={18} className="text-steel" />
      </Link>

      {/* Nasıl işler? — açıklamalar ve haftalık program (tıklayınca açılır) */}
      <details className="panel group">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
          <Icon name="info" size={18} className="text-steel" />
          <span className="flex-1 text-[15px]">{t(locale, "tour.howItWorks")}</span>
          <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
        </summary>
        <div className="space-y-3 px-4 pb-4 text-[14px]">
          <p className="text-steel">{t(locale, "turnuvalar.intro")}</p>
          <p className="text-steel">{t(locale, "turnuvalar.upcomingNote")}</p>
          <div>
            <div className="kicker mb-1">{t(locale, "tour.program")}</div>
            <ul className="flex flex-col gap-1">
              {weekly.map((e) => (
                <li key={e.level} className="flex justify-between gap-2">
                  <span>{e.label}</span>
                  <span className="text-steel">{e.dayName}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-steel">{t(locale, "tour.programNote")}</p>
          </div>
        </div>
      </details>
    </ArenaPage>
  );
}
