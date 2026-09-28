import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareerHistory } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { Stat } from "../parts";
import { TournamentsFilter } from "./TournamentsFilter";

export const dynamic = "force-dynamic";

export default async function GecmisPage() {
  const h = await getCareerHistory();
  if (!h) redirect("/");
  const locale = await getLocale();
  const dateLoc = locale === "en" ? "en-GB" : "tr-TR";

  return (
    <main>
      <h1 className="display text-[28px]">{t(locale, "gecmis.title")}</h1>

      {/* İstatistikler */}
      <section className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="tournament" label={t(locale, "gecmis.tournaments")} value={String(h.stats.totalTournaments)} />
        <Stat icon="trophy" label={t(locale, "gecmis.championships")} value={String(h.stats.championships)} />
        <Stat icon="podium" label={t(locale, "gecmis.medals")} value={String(h.stats.medals)} />
        <Stat icon="medal" label={t(locale, "gecmis.finals")} value={String(h.stats.finals)} />
        <Stat icon="mask" label={t(locale, "gecmis.matches")} value={String(h.stats.matchesPlayed)} />
        <Stat icon="check" label={t(locale, "gecmis.wins")} value={String(h.stats.matchWins)} />
        <Stat
          icon="ranking"
          label={t(locale, "gecmis.bestRank")}
          value={h.stats.careerBestRank != null ? `#${h.stats.careerBestRank}` : "—"}
        />
      </section>

      {/* Oynanan turnuvalar — maçları yeniden izlemek için tıkla */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "gecmis.myTournaments")}</h2>
        {h.tournaments.length === 0 ? (
          <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.noTournaments")}</p>
        ) : (
          <>
            <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.tapHint")}</p>
            <TournamentsFilter tournaments={h.tournaments} locale={locale} />
          </>
        )}
      </section>

      {/* Başarılar */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "gecmis.achievements")}</h2>
        {h.achievements.length === 0 ? (
          <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.noAchievements")}</p>
        ) : (
          <ul className="panel mt-3 divide-y divide-line overflow-hidden">
            {h.achievements.map((a, i) => (
              <li key={i} className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 text-[15px]">
                <span className="min-w-0">
                  {/* Önem 1–5 → yıldız ikonları (emoji değil) */}
                  <span className="mr-1.5 inline-flex align-[-2px] text-steel">
                    {Array.from({ length: Math.min(a.importance, 5) }, (_, k) => (
                      <Icon key={k} name="rating" size={13} />
                    ))}
                    <span className="sr-only">{Math.min(a.importance, 5)}/5</span>
                  </span>
                  <span className="font-medium">{a.label}</span>
                  {a.detail ? <span className="text-steel"> — {a.detail}</span> : null}
                </span>
                <span className="num shrink-0 text-[13px] text-steel">{new Date(a.date).toLocaleDateString(dateLoc)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rakiplikler */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "gecmis.rivals")}</h2>
        {h.rivals.length === 0 ? (
          <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.noRivals")}</p>
        ) : (
          <ol className="panel mt-3 divide-y divide-line overflow-hidden">
            {h.rivals.map((r, i) => (
              <li key={i} className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 text-[15px]">
                <span className="truncate">{r.name}</span>
                <span className="num shrink-0 text-[14px] text-steel">
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
