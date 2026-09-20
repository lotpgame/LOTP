import Link from "next/link";
import { redirect } from "next/navigation";
import { registerTournamentAction, unregisterTournamentAction } from "@/app/actions";
import { TACTICS } from "@/engine/combat";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getUpcomingTournaments } from "@/server/careerService";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const upcoming = await getUpcomingTournaments();

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);
  const intlByMonth = new Map(c.seasonCalendar.filter((e) => e.month > 0).map((e) => [e.month, e]));
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <main>
      <h1 className="text-xl font-bold">{t(locale, "turnuvalar.title")}</h1>
      <p className="mt-1 text-sm opacity-70">{t(locale, "turnuvalar.intro")}</p>

      {/* Oynanmış turnuvalar Kariyer Geçmişi'nde — buradan kolay erişim. */}
      <Link
        href="/kariyer/gecmis"
        className="mt-3 flex items-center justify-between rounded-xl border border-black/10 px-3 py-2.5 text-sm transition hover:border-emerald-500 dark:border-white/15"
      >
        <span className="flex items-center gap-2 font-medium">📜 {t(locale, "turnuvalar.pastLink")}</span>
        <span className="opacity-40">›</span>
      </Link>

      {/* M10.2: Yaklaşan turnuvalar — önceden kayıt + taktik (ortak dünyada sunucu otomatik oynatır) */}
      <section className="mt-5">
        <h2 className="text-base font-semibold">{t(locale, "turnuvalar.upcoming")}</h2>
        <p className="mt-1 text-xs opacity-60">{t(locale, "turnuvalar.upcomingNote")}</p>
        <div className="mt-3 space-y-2.5">
          {upcoming.length === 0 && <p className="text-sm opacity-60">{t(locale, "turnuvalar.noneUpcoming")}</p>}
          {upcoming.map((u) => (
            <div
              key={`${u.worldDay}:${u.level}`}
              className={`rounded-xl border p-3 ${
                u.registered ? "border-emerald-500/60 bg-emerald-500/10" : "border-black/10 dark:border-white/15"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{u.label}</div>
                  <div className="text-xs opacity-60">
                    Q{u.quarter} · H{u.month} · {u.dayName}
                    {u.registered ? ` · ✓ ${t(locale, "turnuvalar.registered")}` : ""}
                  </div>
                </div>
              </div>

              {u.qualified ? (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <form action={registerTournamentAction} className="flex items-end gap-2">
                    <input type="hidden" name="worldDay" value={u.worldDay} />
                    <input type="hidden" name="level" value={u.level} />
                    <label className="text-xs">
                      <span className="mb-0.5 block opacity-60">{t(locale, "turnuvalar.preTactic")}</span>
                      <select
                        name="tactic"
                        defaultValue={u.tactic}
                        className="rounded-lg border border-black/15 bg-transparent px-2 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
                      >
                        {TACTICS.map((tac) => (
                          <option key={tac} value={tac}>
                            {t(locale, `tactic.${tac}`)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-500">
                      {u.registered ? t(locale, "turnuvalar.update") : t(locale, "turnuvalar.register")}
                    </button>
                  </form>
                  {u.registered && (
                    <form action={unregisterTournamentAction}>
                      <input type="hidden" name="worldDay" value={u.worldDay} />
                      <input type="hidden" name="level" value={u.level} />
                      <button className="rounded-lg border border-black/15 px-3 py-1.5 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20">
                        {t(locale, "turnuvalar.cancel")}
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <div className="mt-2 text-xs opacity-60">🔒 {u.requirement}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 space-y-2.5">
        {months.map((m) => {
          const intl = intlByMonth.get(m);
          const isNow = m === c.month;
          const isPast = m < c.month;
          return (
            <div
              key={m}
              className={`rounded-xl border p-3 ${
                isNow
                  ? "border-emerald-500/60 bg-emerald-500/10"
                  : isPast
                    ? "border-black/10 opacity-45 dark:border-white/10"
                    : "border-black/10 dark:border-white/15"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  H{m}
                  {isNow ? ` · ${t(locale, "turnuvalar.thisMonth")}` : ""}
                </h3>
                {intl && (
                  <span className="text-xs text-amber-600 dark:text-amber-400">🌍 {intl.label}</span>
                )}
              </div>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
                {weekly.map((e) => (
                  <li key={e.level}>
                    <span className="font-medium">{e.label}</span> · {e.dayName}
                  </li>
                ))}
                {intl && (
                  <li className={intl.qualified ? "" : "opacity-60"}>
                    <span className="font-medium">{intl.label}</span> · {intl.dayName}{" "}
                    {intl.qualified ? "✓" : `🔒 ${intl.requirement}`}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </section>
    </main>
  );
}
