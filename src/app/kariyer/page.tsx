import Link from "next/link";
import { redirect } from "next/navigation";
import { clearAllReportsAction } from "@/app/actions";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getCareerHeader, getUpcomingTournaments } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { PisteLine } from "@/app/ui/Piste";
import { buildHeadline } from "@/app/ui/headlineText";
import { serverWorldDay } from "@/server/world";
import { KimlikKarti } from "./KimlikKarti";
import { NextTournament } from "./NextTournament";
import { WeekStrip } from "./WeekStrip";
import { buildWeek, todayFromHeader } from "./week";
import { SkillsByCategory, Stat, StatBar, conditionState, formState, toRoman } from "./parts";

export const dynamic = "force-dynamic";

const fmtDelta = (d: number) => (d >= 0 ? `+${d}` : `${d}`);

/**
 * "Bugün" ekranı (eski Profil): dönen oyuncunun ilk göreceği şey — bugün ne var, sıradaki turnuva,
 * sen yokken ne oldu; sonra değerler. Fizik/psikoloji tıklayınca açılır. Yalnız mevcut veriler kullanılır.
 */
export default async function BugunPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const [h, upcoming] = await Promise.all([getCareerHeader(), getUpcomingTournaments()]);
  if (!h) redirect("/");
  const locale = await getLocale();

  const condition = 100 - c.fatigue;
  // Sıradaki turnuvanın kayıt durumu: aynı seviyedeki en yakın yaklaşan turnuva (liste tarihe göre sıralı).
  const nextRegistered = h.nextTournament ? upcoming.find((u) => u.level === h.nextTournament!.level)?.registered : undefined;

  const report = h.report;
  const gains = report?.gains ?? [];
  const showAway = gains.length > 0 || h.awayTournaments.length > 0 || !!report?.injured;

  return (
    <main className="flex flex-col gap-4">
      {/* 0 · KİMLİK KARTI */}
      <KimlikKarti
        name={c.name}
        code={c.code}
        weapon={c.weapon}
        ageCategory={h.ageCategory}
        age={c.age}
        city={h.city}
        nationalTeam={c.nationalTeam}
        seasonNo={c.seasonNo}
        locale={locale}
      />

      {/* 1 · BUGÜN */}
      <section className="panel p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="kicker">{t(locale, "bugun.kicker", { date: c.dateLabel })}</span>
          <span className="text-[13px] text-steel">
            {t(locale, "profil.season")} <span className="num text-ink">{toRoman(c.seasonNo)}</span> ·{" "}
            {t(locale, "bugun.xp", { n: c.experience })}
          </span>
        </div>

        {h.injured ? (
          <div className="mt-3 flex min-h-11 items-center gap-3">
            <Icon name="injury" size={22} className="shrink-0 text-sig-red" />
            <span className="text-[15px]">{t(locale, "profil.injured", { n: h.injuryDaysRemaining })}</span>
          </div>
        ) : h.today.kind === "TOURNAMENT" ? (
          <Link href="/kariyer/turnuvalar" className="mt-3 flex min-h-11 items-center gap-3 rounded-md active:bg-arena-2">
            <Icon name={h.today.qualified ? "tournament" : "lock"} size={22} className="shrink-0" />
            <span className="min-w-0 flex-1 text-[15px]">
              {t(locale, "bugun.tournamentToday", { label: h.today.label ?? "" })}
              {!h.today.qualified && <span className="block text-[13px] text-steel">{h.today.requirement}</span>}
            </span>
            <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
          </Link>
        ) : (
          <Link href="/kariyer/antrenman" className="mt-3 flex min-h-11 items-center gap-3 rounded-md active:bg-arena-2">
            <Icon name="train" size={22} className="shrink-0" />
            <span className="min-w-0 flex-1 text-[15px]">{t(locale, "bugun.training", { label: h.today.trainingLabel ?? "" })}</span>
            <span className="shrink-0 text-[13px] text-steel">{t(locale, "bugun.seePlan")}</span>
            <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
          </Link>
        )}
      </section>

      {h.nextTournament && !h.canAttend && (
        <NextTournament info={h.nextTournament} variant="card" locale={locale} registered={nextRegistered} />
      )}

      <WeekStrip days={buildWeek(serverWorldDay(), c.trainingPlan, upcoming, todayFromHeader(h, locale))} locale={locale} />

      {/* 2 · SEN YOKKEN — antrenman raporu + yokken oynanan turnuvalar tek panelde */}
      {showAway && (
        <section className="panel p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="kicker pt-1">{t(locale, "bugun.away")}</span>
            <form action={clearAllReportsAction}>
              <button className="-mt-2 -mr-2 flex h-11 w-11 items-center justify-center rounded-md text-steel active:bg-arena-2" aria-label={t(locale, "common.close")}>
                <Icon name="close" size={18} />
              </button>
            </form>
          </div>

          {report && (
            <>
              <div className="mt-1 text-[13px] text-steel">{t(locale, "report.title", { n: report.days })}</div>
              {gains.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gains.map((g) => {
                    // `key` varsa dile göre çevrilir; eski (bu alan eklenmeden önce yazılmış) raporlarda
                    // yalnız sabit TR `label` olabilir — geriye dönük okunur (canlı veri kaybı olmasın).
                    const label = g.key ? t(locale, `skill.${g.key}`) : (g.label ?? "");
                    return (
                      <span key={g.key ?? g.label} className="rounded-md bg-arena-2 px-2 py-1 text-[13px]">
                        <span className="num">+{g.delta.toFixed(1)}</span> {label}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-steel">
                <span className="inline-flex items-center gap-1">
                  <Icon name="condition" size={15} /> {t(locale, "report.condition")} <span className="num text-ink">{fmtDelta(report.conditionDelta)}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="form" size={15} /> {t(locale, "report.form")} <span className="num text-ink">{fmtDelta(report.sharpnessDelta)}</span>
                </span>
                {report.injured && (
                  <span className="inline-flex items-center gap-1 font-medium text-sig-red">
                    <Icon name="injury" size={15} /> {t(locale, "report.injured")}
                  </span>
                )}
              </div>
            </>
          )}

          {h.awayTournaments.length > 0 && (
            <ul className={`flex flex-col ${report ? "mt-3 border-t border-line pt-2" : "mt-1"}`}>
              {h.awayTournaments.map((tr) => (
                <li key={tr.tournamentId}>
                  <Link href={`/turnuva/${tr.tournamentId}`} className="flex min-h-12 items-center gap-2 rounded-md px-1 active:bg-arena-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-medium leading-snug">
                        {buildHeadline(locale, { name: h.name, tournament: tr.name, position: tr.position }).title}
                      </div>
                      <div className="flex flex-wrap gap-x-2 text-[13px] text-steel">
                        <span>{tr.dateLabel}</span>
                        <span className="num text-ink">
                          {tr.position}./{tr.fieldSize}
                        </span>
                        {tr.points > 0 && <span className="num">{t(locale, "away.points", { n: tr.points })}</span>}
                        {tr.newRank != null && <span className="num">#{tr.newRank}</span>}
                      </div>
                    </div>
                    <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 3 · Üç anahtar değer */}
      <section className="grid grid-cols-3 gap-2.5">
        <Stat icon="rating" label={t(locale, "profil.overall")} value={c.overall.toFixed(1)} />
        <Stat icon="condition" label={t(locale, "profil.condition")} value={`%${condition.toFixed(0)}`} gauge={condition} state={conditionState(locale, condition)} />
        <Stat icon="form" label={t(locale, "profil.form")} value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} state={formState(locale, c.sharpness)} />
      </section>

      <PisteLine className="my-1" />

      {/* 4 · Yetenekler */}
      <section>
        <h2 className="display mb-3 text-[22px]">{t(locale, "profil.skills")}</h2>
        <SkillsByCategory skills={c.skills} locale={locale} categoryId={c.categoryId} />
      </section>

      <PisteLine className="my-1" />

      {/* 5 · Fizik + Psikoloji — tıklayınca açılır */}
      <section className="flex flex-col gap-2.5">
        <details className="panel group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
            <Icon name="physique" size={18} className="text-steel" />
            <span className="flex-1 font-display text-[17px] font-bold uppercase tracking-wide">{t(locale, "profil.physique")}</span>
            <span className="num text-[13px] text-steel">
              {c.physique.heightCm.toFixed(0)} cm · {c.physique.weightKg.toFixed(0)} kg
            </span>
            <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
          </summary>
          <ul className="space-y-1.5 px-4 pb-4 text-[14px]">
            <li className="flex justify-between"><span>{t(locale, "profil.height")}</span><span className="num">{c.physique.heightCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.reach")}</span><span className="num">{c.physique.reachCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.leg")}</span><span className="num">{c.physique.legLengthCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.weight")}</span><span className="num">{c.physique.weightKg.toFixed(0)} kg</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.hand")}</span><span>{c.physique.leftHanded ? t(locale, "profil.left") : t(locale, "profil.right")}</span></li>
          </ul>
        </details>

        <details className="panel group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
            <Icon name="mental" size={18} className="text-steel" />
            <span className="flex-1 font-display text-[17px] font-bold uppercase tracking-wide">{t(locale, "profil.psychology")}</span>
            <span className="text-[13px] text-steel">
              {t(locale, "profil.morale")} <span className="num">%{c.psychology.morale.toFixed(0)}</span>
            </span>
            <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <StatBar label={t(locale, "profil.morale")} value={c.psychology.morale} />
            <StatBar label={t(locale, "profil.motivation")} value={c.psychology.motivation} />
            <StatBar label={t(locale, "profil.confidence")} value={c.psychology.confidence} />
            <StatBar label={t(locale, "profil.stress")} value={c.psychology.stress} />
            {c.traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {c.traits.map((tr) => (
                  <span key={tr} className="rounded-md border border-line px-2 py-0.5 text-[13px]">
                    {t(locale, `trait.${tr}`)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </details>
      </section>
    </main>
  );
}
