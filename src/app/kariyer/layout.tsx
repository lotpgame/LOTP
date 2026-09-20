import Link from "next/link";
import { redirect } from "next/navigation";
import { attendTournamentAction, clearAwayReportAction, clearReportAction, skipDayAction } from "@/app/actions";
import { GENDER_LABEL_TR, WEAPON_LABEL_TR, type Gender, type Weapon } from "@/engine/domain";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareerHeader } from "@/server/careerService";
import { AutoAdvance } from "./AutoAdvance";
import { CareerNav } from "./CareerNav";

const fmtDelta = (d: number) => (d >= 0 ? `+${d}` : `${d}`);

// Kariyer verisine bağlı: her istekte taze.
export const dynamic = "force-dynamic";

export default async function KariyerLayout({ children }: LayoutProps<"/kariyer">) {
  const h = await getCareerHeader();
  if (!h) redirect("/");
  // Devam eden canlı turnuva varsa tüm kariyer sayfaları yerine turnuva ekranına götür (immersion).
  if (h.liveTournamentActive) redirect("/turnuva/canli");
  const locale = await getLocale();

  const meta = `${h.code} · ${GENDER_LABEL_TR[h.gender as Gender]} · ${WEAPON_LABEL_TR[h.weapon as Weapon]} · ${h.age} yaş · ${h.categoryId}`;
  const dateLabel = `🌍 Q${h.quarter} · H${h.month} · ${h.dayName}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-28 sm:px-6">
      {/* Dünya saati: işlenecek gün varsa otomatik "dünyaya yetiş" (buton yok). */}
      <AutoAdvance active={h.needsSync} />
      <CareerNav name={h.name} meta={meta} locale={locale} />

      {/* Antrenman haberi — son "İlerle"nin özeti (kazanımlar + kondisyon/keskinlik değişimi). */}
      {h.report && (
        <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-medium">📰 Antrenman raporu · {h.report.days} gün</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                {h.report.gains.length > 0 ? (
                  h.report.gains.map((g) => (
                    <span key={g.label} className="font-medium text-emerald-700 dark:text-emerald-300">
                      +{g.delta.toFixed(1)} {g.label}
                    </span>
                  ))
                ) : (
                  <span className="opacity-60">Bu sürede kayda değer gelişim yok</span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 text-xs opacity-70">
                <span>🔋 Kondisyon {fmtDelta(h.report.conditionDelta)}</span>
                <span>🎯 Form {fmtDelta(h.report.sharpnessDelta)}</span>
                {h.report.injured && <span className="font-medium text-amber-600 dark:text-amber-400">🩹 Sakatlandın!</span>}
              </div>
            </div>
            <form action={clearReportAction}>
              <button className="shrink-0 rounded-md px-2 py-1 text-xs opacity-50 transition hover:opacity-100" title="Kapat">
                ✕
              </button>
            </form>
          </div>
        </div>
      )}

      {/* M11.4: "Yokken neler oldu" — sen offline'ken otomatik oynanan turnuvalar (Hattrick-tarzı yakalama). */}
      {h.awayTournaments.length > 0 && (
        <div className="mb-4 rounded-xl border border-sky-500/30 bg-sky-500/[0.08] p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium">🗓️ Sen yokken · {h.awayTournaments.length} turnuva oynandı</div>
              <ul className="mt-2 flex flex-col gap-1.5">
                {h.awayTournaments.map((tr) => (
                  <li key={tr.tournamentId}>
                    <Link
                      href={`/turnuva/${tr.tournamentId}`}
                      className="flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-md px-1 py-0.5 transition hover:bg-sky-500/10"
                    >
                      <span className="font-medium">{tr.name}</span>
                      <span className="text-xs opacity-60">{tr.dateLabel}</span>
                      <span className="text-xs font-medium text-sky-700 dark:text-sky-300">
                        {tr.position}. / {tr.fieldSize}
                      </span>
                      {tr.points > 0 && <span className="text-xs opacity-70">+{tr.points} puan</span>}
                      {tr.newRank != null && <span className="text-xs opacity-70">· Klasman #{tr.newRank}</span>}
                      <span className="text-xs opacity-40">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <form action={clearAwayReportAction}>
              <button className="shrink-0 rounded-md px-2 py-1 text-xs opacity-50 transition hover:opacity-100" title="Kapat">
                ✕
              </button>
            </form>
          </div>
        </div>
      )}

      {children}

      {/* Sabit alt çubuk — sayfalar arası değişmez (gün-bazlı zaman sürücüsü). Online'da otomatik akar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/90 backdrop-blur dark:border-white/10 dark:bg-black/80">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 text-sm">
            <div className="font-medium tabular-nums">{dateLabel}</div>
            <div className="truncate text-xs opacity-60">
              {h.injured
                ? t(locale, "bar.injured", { n: h.injuryDaysRemaining })
                : h.today.kind === "TOURNAMENT"
                  ? `🏆 ${h.today.label}${h.today.qualified ? "" : ` · 🔒 ${h.today.requirement}`}`
                  : `🎯 ${h.today.trainingLabel}`}
            </div>
          </div>

          {h.canAttend ? (
            // Uygun turnuva günü geldi → Katıl / Geç
            <div className="flex shrink-0 gap-2">
              <form action={skipDayAction}>
                <button className="rounded-lg border border-black/15 px-3 py-2.5 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20">
                  {t(locale, "bar.gec")}
                </button>
              </form>
              <form action={attendTournamentAction}>
                <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                  {t(locale, "bar.katil")}
                </button>
              </form>
            </div>
          ) : h.needsSync ? (
            // Dünyaya yetişiliyor (otomatik) — buton yok
            <div className="shrink-0 animate-pulse text-sm font-medium text-sky-600 dark:text-sky-400">
              {t(locale, "bar.syncing")}
            </div>
          ) : (
            // Dünya güncel — sonraki gün gerçek zamanda gelecek
            <div className="shrink-0 text-right text-xs opacity-60">{t(locale, "bar.caughtUp")}</div>
          )}
        </div>
      </div>
    </div>
  );
}
