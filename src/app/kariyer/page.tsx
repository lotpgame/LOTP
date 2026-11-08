import Link from "next/link";
import { ArenaPage } from "@/app/ArenaPage";
import { redirect } from "next/navigation";
import { clearAllReportsAction } from "@/app/actions";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getCareerHeader, getUpcomingTournaments } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { PisteLine } from "@/app/ui/Piste";
import { bandMax } from "@/app/ui/bands";
import { buildHeadline } from "@/app/ui/headlineText";
import { serverWorldDay } from "@/server/world";
import { CollapsibleSection } from "./CollapsibleSection";
import { KimlikKarti } from "./KimlikKarti";
import { SkillRadar } from "./SkillRadar";
import { WeekStrip } from "./WeekStrip";
import { buildWeek, todayFromHeader } from "./week";
import { trainingImg } from "./trainingImage";
import { SkillsByCategory, Stat, StatBar, conditionState, formState } from "./parts";
import { ErrorBanner } from "./ErrorBanner";

const GLOW_FROM = 70; // form/kondisyon ışıltısı eşiği (GORSEL §8: "ör. ≥%70")

export const dynamic = "force-dynamic";

const fmtDelta = (d: number) => (d >= 0 ? `+${d}` : `${d}`);

/**
 * "Bugün" ekranı (eski Profil): dönen oyuncunun ilk göreceği şey — bugün ne var, sıradaki turnuva,
 * sen yokken ne oldu; sonra değerler. Fizik/psikoloji tıklayınca açılır. Yalnız mevcut veriler kullanılır.
 */
export default async function BugunPage({
  searchParams,
}: {
  searchParams: Promise<{ err?: string }>;
}) {
  const c = await getCareer();
  if (!c) redirect("/");
  const [h, upcoming] = await Promise.all([getCareerHeader(), getUpcomingTournaments()]);
  if (!h) redirect("/");
  const locale = await getLocale();
  const { err } = await searchParams;

  const condition = 100 - c.fatigue;

  const report = h.report;
  const gains = report?.gains ?? [];
  const showAway = gains.length > 0 || h.awayTournaments.length > 0 || !!report?.injured || h.traitEvents.length > 0;

  return (
    <ArenaPage bg="/img/bg-bugun.webp" className="flex flex-col gap-4">
      <ErrorBanner code={err} locale={locale} dismissHref="/kariyer" />
      {/* 0 · KİMLİK KARTI */}
      <KimlikKarti
        name={c.name}
        code={c.code}
        weapon={c.weapon}
        ageCategory={h.ageCategory}
        age={c.age}
        city={h.city}
        club={c.club?.name ?? null}
        countryCode={c.countryCode}
        rating={c.overall}
        nationalTeam={c.nationalTeam}
        seasonNo={c.seasonNo}
        avatar={h.avatar}
        locale={locale}
      />

      {/* Sadeleştirme (#38): Son başarılar + "Bugün" aktivite bölümü + Sıradaki turnuva kartı kaldırıldı.
          "Önümüzdeki 7 gün" şeridi zaten bugünkü etkinliği/sıradaki turnuvayı gösteriyor. */}
      <WeekStrip days={buildWeek(serverWorldDay(), c.trainingPlan, upcoming, todayFromHeader(h, locale))} locale={locale} countryCode={c.countryCode} />

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
                  {gains.map((g, i) => {
                    // `key` varsa dile göre çevrilir; eski (bu alan eklenmeden önce yazılmış) raporlarda
                    // yalnız sabit TR `label` olabilir — geriye dönük okunur (canlı veri kaybı olmasın).
                    const label = g.key ? t(locale, `skill.${g.key}`) : (g.label ?? "");
                    return (
                      <span key={g.key ?? g.label} className="rounded-md bg-arena-2 px-2 py-1 text-[13px]">
                        {/* kazanım rakamı sırayla yerine süzülür (GORSEL_ETKILESIM §6 "+X") */}
                        <span className="num anim-rise inline-block" style={{ animationDelay: `${i * 70}ms` }}>
                          +{g.delta.toFixed(1)}
                        </span>{" "}
                        {label}
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
              {/* Dilim 3-1: hayat olayları (haftada 1 iyi + 1 kötü) */}
              {report.events && report.events.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border-t border-line pt-2">
                  {report.events.map((ek, i) => (
                    <li key={`${ek}-${i}`} className="flex items-center gap-2 text-[13px] text-steel">
                      <Icon name="info" size={14} className="shrink-0" /> {t(locale, `event.${ek}`)}
                    </li>
                  ))}
                </ul>
              )}
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

          {/* Katman 2: trait evrimi bildirimleri — "karakterin gelişti" (GDD 10.37). */}
          {h.traitEvents.length > 0 && (
            <ul className={`flex flex-col gap-1.5 ${report || h.awayTournaments.length > 0 ? "mt-3 border-t border-line pt-2" : "mt-1"}`}>
              {h.traitEvents.map((ev, i) => (
                <li key={`${ev.to}-${i}`} className="flex items-center gap-2 text-[14px]">
                  <Icon name="mental" size={16} className="shrink-0 text-ink" />
                  <span className="text-steel">
                    {t(locale, ev.kind === "TRANSFORM" ? "bugun.traitTransform" : "bugun.traitAcquire")}:
                  </span>
                  <span className="font-medium">
                    {ev.kind === "TRANSFORM" && ev.from ? (
                      <>
                        <span className="text-steel line-through">{t(locale, `trait.${ev.from}`)}</span>
                        {" → "}
                        {t(locale, `trait.${ev.to}`)}
                      </>
                    ) : (
                      <>+ {t(locale, `trait.${ev.to}`)}</>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* 3 · Kondisyon + form (reyting büyük başlıkta) — yüksekken çubuklar hafifçe parlar (GORSEL §8) */}
      <section className="grid grid-cols-2 gap-2.5">
        <Stat
          img="/img/ui/kondisyon.webp"
          label={t(locale, "profil.condition")}
          value={`%${condition.toFixed(0)}`}
          gauge={condition}
          glow={condition >= GLOW_FROM}
          traffic
          state={conditionState(locale, condition)}
        />
        <Stat
          img="/img/ui/form.webp"
          label={t(locale, "profil.form")}
          value={`%${c.sharpness.toFixed(0)}`}
          gauge={c.sharpness}
          glow={c.sharpness >= GLOW_FROM}
          traffic
          state={formState(locale, c.sharpness)}
        />
      </section>

      <PisteLine className="my-1" />

      {/* 4 · Yetenekler — radar (şimdi / geçen çeyrek / +N), altında kategori çubukları */}
      <CollapsibleSection title={t(locale, "profil.skills")} icon="/img/ui/yetenekler.webp" defaultOpen>
        <div className="flex flex-col gap-4">
          <SkillRadar skills={c.skills} base={c.skillBase?.values ?? null} max={bandMax(c.categoryId)} locale={locale} />
          <SkillsByCategory skills={c.skills} locale={locale} categoryId={c.categoryId} />
        </div>
      </CollapsibleSection>

      <PisteLine className="my-1" />

      {/* 5 · Fizik + Psikoloji — tıklayınca açılır */}
      <section className="flex flex-col gap-2.5">
        <details className="panel group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 [&::-webkit-details-marker]:hidden">
            <img src={trainingImg("PHYSICAL")} alt="" aria-hidden="true" className="shrink-0 rounded-md object-cover" style={{ width: 26, height: 26 }} />
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
            <img src={trainingImg("MENTAL")} alt="" aria-hidden="true" className="shrink-0 rounded-md object-cover" style={{ width: 26, height: 26 }} />
            <span className="flex-1 font-display text-[17px] font-bold uppercase tracking-wide">{t(locale, "profil.psychology")}</span>
            <span className="text-[13px] text-steel">
              {t(locale, "profil.morale")} <span className="num">%{c.psychology.morale.toFixed(0)}</span>
            </span>
            <Icon name="chevron-down" size={18} className="text-steel transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-3 px-4 pb-4">
            <StatBar label={t(locale, "profil.morale")} value={c.psychology.morale} tone="good" />
            <StatBar label={t(locale, "profil.motivation")} value={c.psychology.motivation} tone="good" />
            <StatBar label={t(locale, "profil.confidence")} value={c.psychology.confidence} tone="good" />
            <StatBar label={t(locale, "profil.stress")} value={c.psychology.stress} tone="bad" />
            {/* İtibar/fair-play (GDD 10 ahlak ekseni): Çirkef/Hilekâr düşürür. Oyun-içi ceza V2. */}
            <StatBar label={t(locale, "profil.reputation")} value={c.psychology.reputation} tone="good" />
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
    </ArenaPage>
  );
}
