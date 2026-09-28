import Link from "next/link";
import { redirect } from "next/navigation";
import { attendTournamentAction, registerTournamentAction, unregisterTournamentAction } from "@/app/actions";
import { TACTICS } from "@/engine/combat";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getCareerHeader, getNextTournament, getUpcomingTournaments } from "@/server/careerService";
import { NextTournament } from "../NextTournament";

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

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);

  return (
    <main>
      <h1 className="text-xl font-bold">{t(locale, "turnuvalar.title")}</h1>
      <p className="mt-1 text-sm opacity-70">{t(locale, "turnuvalar.intro")}</p>

      {/* #5a: turnuva CANLI — giriş buradan (alt çubukta Katıl yok). Bugünkü uygun turnuva açık. */}
      {liveNow && (
        <div className="mt-4 rounded-xl border border-red-500/50 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-600 dark:text-red-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" /> CANLI
          </div>
          <div className="mt-1 text-lg font-bold">🏆 {liveNow.label}</div>
          <p className="mt-1 text-sm opacity-70">Turnuva başladı — şimdi girip maçlarını oyna.</p>
          <form action={attendTournamentAction} className="mt-3">
            <button className="w-full rounded-lg bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-500">
              🔴 Turnuvaya Gir
            </button>
          </form>
        </div>
      )}

      {/* Sıradaki turnuva + gerçek saat + canlı geri sayım (her akşam gün geçişi). */}
      {!liveNow && next && (
        <div className="mt-4">
          <NextTournament info={next} variant="card" locale={locale} />
          <p className="mt-1.5 text-xs opacity-55">
            Turnuvalar her akşam gün geçişinde açılır · Salı → İl · Perşembe → Türkiye · Cumartesi → Open
          </p>
        </div>
      )}

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
                    📅 {u.dateLabel}
                    {u.registered ? ` · ✓ ${t(locale, "turnuvalar.registered")}` : ""}
                  </div>
                  {/* #28: bu turnuva ne verir — Open tecrübe, şampiyona klasman puanı */}
                  <div className="mt-0.5 text-[11px] font-medium">
                    {u.level === "OPEN" ? (
                      <span className="text-sky-600 dark:text-sky-400">✨ Tecrübe kazandırır (klasman puanı yok)</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400">🏅 Klasman puanı + tecrübe</span>
                    )}
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

      {/* Sezon programı — haftalık tekrar (etkinlik akşam 19:00). Aylık "H1-H12" grid'i kaldırıldı (gerçek tarih modeli). */}
      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <h3 className="text-sm font-semibold">📋 Sezon programı</h3>
        <p className="mt-1 text-xs opacity-60">Her hafta tekrarlanır · etkinlik akşam 19:00 · Open turnuvalar iki haftada bir.</p>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-80">
          {weekly.map((e) => (
            <li key={e.level}>
              <span className="font-medium">{e.label}</span> · {e.dayName}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs opacity-55">
          Uluslararası turnuvalar (Satellite / Grand Prix / Avrupa / Dünya) sezonda birkaç kez; uygunluk klasman sırasına bağlı.
        </p>
      </section>
    </main>
  );
}
