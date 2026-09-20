import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareerHistory } from "@/server/careerService";
import { TournamentsFilter } from "./TournamentsFilter";

export const dynamic = "force-dynamic";

export default async function GecmisPage() {
  const h = await getCareerHistory();
  if (!h) redirect("/");
  const locale = await getLocale();
  const dateLoc = locale === "en" ? "en-GB" : "tr-TR";

  return (
    <main>
      <h1 className="text-xl font-bold">{t(locale, "gecmis.title")}</h1>

      {/* İstatistikler */}
      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="🏟" label={t(locale, "gecmis.tournaments")} value={h.stats.totalTournaments} />
        <Stat icon="🥇" label={t(locale, "gecmis.championships")} value={h.stats.championships} />
        <Stat icon="🎖" label={t(locale, "gecmis.medals")} value={h.stats.medals} />
        <Stat icon="🏅" label={t(locale, "gecmis.finals")} value={h.stats.finals} />
        <Stat icon="🤺" label={t(locale, "gecmis.matches")} value={h.stats.matchesPlayed} />
        <Stat icon="✅" label={t(locale, "gecmis.wins")} value={h.stats.matchWins} />
        <Stat
          icon="📈"
          label={t(locale, "gecmis.bestRank")}
          value={h.stats.careerBestRank != null ? `#${h.stats.careerBestRank}` : "—"}
        />
      </section>

      {/* Oynanan turnuvalar — maçları yeniden izlemek için tıkla */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t(locale, "gecmis.myTournaments")}</h2>
        {h.tournaments.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">{t(locale, "gecmis.noTournaments")}</p>
        ) : (
          <>
            <p className="mt-1 text-sm opacity-60">{t(locale, "gecmis.tapHint")}</p>
            <TournamentsFilter tournaments={h.tournaments} locale={locale} />
          </>
        )}
      </section>

      {/* Başarılar */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t(locale, "gecmis.achievements")}</h2>
        {h.achievements.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">{t(locale, "gecmis.noAchievements")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {h.achievements.map((a, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm dark:border-white/15"
              >
                <span>
                  {"★".repeat(Math.min(a.importance, 5))}{" "}
                  <span className="font-medium">{a.label}</span>
                  {a.detail ? <span className="opacity-60"> — {a.detail}</span> : null}
                </span>
                <span className="shrink-0 text-xs opacity-50">
                  {new Date(a.date).toLocaleDateString(dateLoc)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rakiplikler */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">{t(locale, "gecmis.rivals")}</h2>
        {h.rivals.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">{t(locale, "gecmis.noRivals")}</p>
        ) : (
          <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
            {h.rivals.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{r.name}</span>
                <span className="tabular-nums opacity-70">
                  {t(locale, "gecmis.record", { m: r.matches, w: r.wins, l: r.losses })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 dark:border-white/15 dark:bg-white/[0.02]">
      <div className="flex items-center gap-1 text-xs opacity-60">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}
