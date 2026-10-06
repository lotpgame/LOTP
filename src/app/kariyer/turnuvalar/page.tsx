import Link from "next/link";
import { redirect } from "next/navigation";
import { attendTournamentAction, registerTournamentAction, unregisterTournamentAction } from "@/app/actions";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getCareerHeader, getNextTournament, getUpcomingTournaments } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { TacticSegment } from "@/app/ui/TacticSegment";
import { serverWorldDay } from "@/server/world";
import { LevelTag, NextTournament } from "../NextTournament";
import { WeekStrip } from "../WeekStrip";
import { buildWeek, todayFromHeader } from "../week";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const upcoming = await getUpcomingTournaments();
  const next = await getNextTournament();
  const header = await getCareerHeader();
  // #5a: turnuva zamanı geldiyse burada CANLI görünür ve giriş buradan yapılır (alt çubukta Katıl yok).
  const liveNow = header?.canAttend && header.today.kind === "TOURNAMENT" ? header.today : null;
  const nextRegistered = next ? upcoming.find((u) => u.worldDay === next.worldDay)?.registered : undefined;

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);

  return (
    <main className="flex flex-col gap-4">
      <h1 className="display text-[28px]">{t(locale, "turnuvalar.title")}</h1>

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
      {!liveNow && next && <NextTournament info={next} variant="card" locale={locale} registered={nextRegistered} registerHref="#yaklasan" />}

      <WeekStrip days={buildWeek(serverWorldDay(), c.trainingPlan, upcoming, todayFromHeader(header, locale))} locale={locale} />

      {/* M10.2: Yaklaşan turnuvalar — önceden kayıt + taktik (ortak dünyada sunucu otomatik oynatır) */}
      <section id="yaklasan" className="scroll-mt-20">
        <h2 className="kicker mb-2">{t(locale, "turnuvalar.upcoming")}</h2>
        {upcoming.length === 0 && <p className="text-[14px] text-steel">{t(locale, "turnuvalar.noneUpcoming")}</p>}
        <ul className="flex flex-col gap-2.5">
          {upcoming.map((u) => (
            <li key={`${u.worldDay}:${u.level}`} className="panel relative overflow-hidden p-3">
              {u.registered && <span className="absolute inset-y-0 left-0 w-[3px] bg-ink" aria-hidden="true" />}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold">{u.label}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-steel">
                    <Icon name="calendar" size={14} /> {u.dateLabel}
                  </div>
                </div>
                <LevelTag level={u.level} locale={locale} />
              </div>

              {/* #28: bu turnuva ne verir — Open tecrübe, şampiyona klasman puanı */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="rounded-md border border-line px-1.5 py-0.5 text-[12px] text-steel">
                  {u.level === "OPEN" ? t(locale, "tour.rewardXp") : t(locale, "tour.rewardRank")}
                </span>
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
                // Taktik seçici "Kaydol"a basınca açılır (liste kısa kalır). JS yok: native <details>.
                // Listede ikincil buton — ekrandaki tek ana (mürekkep) buton üstteki kartta.
                <details className="group mt-3">
                  <summary
                    className="btn-ghost press w-full cursor-pointer list-none group-open:border-ink [&::-webkit-details-marker]:hidden"
                  >
                    {u.registered ? t(locale, "tour.changeTactic") : t(locale, "turnuvalar.register")}
                    <Icon name="chevron-down" size={16} className="transition-transform group-open:rotate-180" />
                  </summary>
                  <form action={registerTournamentAction} className="mt-2 flex flex-col gap-2">
                    <input type="hidden" name="worldDay" value={u.worldDay} />
                    <input type="hidden" name="level" value={u.level} />
                    <TacticSegment defaultValue={u.tactic} locale={locale} />
                    {u.isToday && <p className="text-[13px] text-steel">{t(locale, "turnuvalar.todayTactic")}</p>}
                    <div className="flex gap-2">
                      <button className="btn-ink press flex-1">
                        {u.registered ? t(locale, "turnuvalar.update") : t(locale, "tour.confirm")}
                      </button>
                      {u.registered && !u.isToday && (
                        <button
                          formAction={unregisterTournamentAction}
                          className="min-h-11 px-3 text-[14px] text-steel underline underline-offset-2"
                        >
                          {t(locale, "turnuvalar.cancel")}
                        </button>
                      )}
                    </div>
                  </form>
                </details>
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
    </main>
  );
}
