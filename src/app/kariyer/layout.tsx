import Link from "next/link";
import { redirect } from "next/navigation";
import { skipDayAction } from "@/app/actions";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareerHeader } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { AutoAdvance } from "./AutoAdvance";
import { CareerNav } from "./CareerNav";
import { NextTournament } from "./NextTournament";

// Kariyer verisine bağlı: her istekte taze.
export const dynamic = "force-dynamic";

export default async function KariyerLayout({ children }: LayoutProps<"/kariyer">) {
  const h = await getCareerHeader();
  if (!h) redirect("/");
  // Devam eden canlı turnuva varsa tüm kariyer sayfaları yerine turnuva ekranına götür (immersion).
  if (h.liveTournamentActive) redirect("/turnuva/canli");
  const locale = await getLocale();

  // Gün çubuğunda yıl gereksiz yer kaplıyor ("28 Eylül Pazartesi").
  const shortDate = h.dateLabel.replace(` ${h.year}`, "");

  const todayLine = h.injured ? (
    <span className="flex min-w-0 items-center gap-1.5 text-sig-red">
      <Icon name="injury" size={15} className="shrink-0" />
      <span className="truncate">{t(locale, "bar.injured", { n: h.injuryDaysRemaining })}</span>
    </span>
  ) : h.today.kind === "TOURNAMENT" ? (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon name={h.today.qualified ? "tournament" : "lock"} size={15} className="shrink-0" />
      <span className="truncate">
        {h.today.label}
        {h.today.qualified ? "" : ` · ${h.today.requirement}`}
      </span>
    </span>
  ) : (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon name="train" size={15} className="shrink-0" />
      <span className="truncate">{h.today.trainingLabel}</span>
    </span>
  );

  // Gün çubuğu: tamamı Turnuvalar'a giden bir bağlantı (sağdaki ok bunu belli eder).
  const ticker = (
    <div className="px-4 pt-2 pb-2 sm:px-6 lg:px-4 lg:pb-4">
      {h.canAttend && (
        // Turnuva zamanı: giriş Turnuvalar'dan (canlı). "Geç" = oynamadan o günün antrenmanı, sonraki güne geç.
        <div className="mb-2 flex gap-2">
          <Link href="/kariyer/turnuvalar" className="btn-ink press flex-1 whitespace-nowrap lg:px-3 lg:text-[14px]">
            <span className="lamp lamp-red anim-live h-2.5 w-2.5" aria-hidden="true" />
            {t(locale, "bar.liveGo")}
          </Link>
          <form action={skipDayAction}>
            <button className="btn-ghost press">{t(locale, "bar.gec")}</button>
          </form>
        </div>
      )}
      <Link href="/kariyer/turnuvalar" className="flex min-h-11 items-center gap-2 rounded-md active:bg-arena-2">
        <div className="min-w-0 flex-1 text-[14px]">
          <div className="flex min-w-0 items-center gap-2 lg:flex-col lg:items-start lg:gap-1">
            <span className="shrink-0 rounded border border-line bg-arena-0 px-1.5 py-0.5 text-[12px] font-semibold">{shortDate}</span>
            {todayLine}
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            {h.needsSync ? (
              <span className="flex items-center gap-1.5 text-[13px] text-steel">
                <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
                {t(locale, "bar.syncing")}
              </span>
            ) : !h.injured && h.today.kind === "TRAINING" && h.nextTournament ? (
              <NextTournament info={h.nextTournament} variant="bar" locale={locale} />
            ) : (
              <span className="text-[13px] text-steel">{t(locale, "bar.caughtUp")}</span>
            )}
          </div>
        </div>
        <Icon name="chevron-right" size={18} className="shrink-0 text-steel" />
      </Link>
    </div>
  );

  return (
    <div className="lg:pl-64">
      <div className={`mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8 lg:pt-8 lg:pb-40 ${h.canAttend ? "pb-64" : "pb-48"}`}>
        {/* Dünya saati: işlenecek gün varsa otomatik "dünyaya yetiş" (buton yok). */}
        <AutoAdvance active={h.needsSync} />
        <CareerNav
          name={h.name}
          locale={locale}
          weapon={h.weapon}
          gender={h.gender}
          ageCategory={h.ageCategory}
          age={h.age}
          city={h.city}
          nationalTeam={h.nationalTeam}
          ticker={ticker}
        />

        {children}
      </div>
    </div>
  );
}
