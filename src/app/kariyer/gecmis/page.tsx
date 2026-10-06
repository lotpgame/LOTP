import { redirect } from "next/navigation";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareerHistory } from "@/server/careerService";
import { Icon, type IconName } from "@/app/ui/Icon";
import { ACH_ICON, METAL_BRONZE, METAL_GOLD, METAL_SILVER, PRIO_RING } from "@/app/ui/achievementBadge";
import { buildShowcase, buildTimeline, nextGoal, type Badge, type BadgeKey } from "@/app/ui/showcase";
import { Stat } from "../parts";
import { TournamentsFilter } from "./TournamentsFilter";

export const dynamic = "force-dynamic";

// Kupa vitrini (docs/GORSEL_ETKILESIM.md §7): rozet → ikon + renk. Altın/gümüş/bronz = metal renkleri (sinyal değil,
// tema değiştirmez); milli takım = vurgu (--prio, tek prestij rengi). Üst kademe hedefleri açılınca altın.
const BADGE: Record<BadgeKey, { icon: IconName; tone: string }> = {
  champion: { icon: "trophy", tone: METAL_GOLD },
  gold: { icon: "medal", tone: METAL_GOLD },
  silver: { icon: "medal", tone: METAL_SILVER },
  bronze: { icon: "medal", tone: METAL_BRONZE },
  national: { icon: "flag", tone: PRIO_RING },
  rankingOne: { icon: "crown", tone: METAL_GOLD },
  european: { icon: "podium", tone: METAL_GOLD },
  worldCup: { icon: "podium", tone: METAL_GOLD },
  olympics: { icon: "podium", tone: METAL_GOLD },
};

const DATE_LOCALE: Partial<Record<Locale, string>> = { en: "en-GB", de: "de-DE" };

/** Tam tarih (gün · ay · yıl, GMT) dünya gününden; eski kayıtta tarih yoksa çeyrek (Q). */
function fmtDate(locale: Locale, d: { dateMs: number | null; quarter: number }, month: "short" | "long"): string {
  if (d.dateMs == null) return `Q${d.quarter}`;
  return new Date(d.dateMs).toLocaleDateString(DATE_LOCALE[locale] ?? "tr-TR", { timeZone: "UTC", day: "numeric", month, year: "numeric" });
}

function badgeLabel(locale: Locale, key: BadgeKey): string {
  if (key === "european") return t(locale, "tournament.EUROPEAN");
  if (key === "worldCup") return t(locale, "tournament.WORLD_CUP");
  return t(locale, `gecmis.badge.${key}`);
}

function BadgeTile({ b, locale }: { b: Badge; locale: Locale }) {
  const { icon, tone } = BADGE[b.key];
  const earned = !b.locked && b.count > 0;
  return (
    <li className={`panel flex flex-col items-center px-2 py-3 text-center ${b.locked ? "opacity-60" : ""}`}>
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full border border-line ${earned ? tone : "bg-arena-2 text-steel"}`}
      >
        <Icon name={b.locked ? "lock" : icon} size={24} />
      </span>
      <span className="mt-2 text-[13px] font-medium leading-tight">{badgeLabel(locale, b.key)}</span>
      {b.locked ? (
        <span className="mt-1 text-[13px] text-steel">{t(locale, "gecmis.locked")}</span>
      ) : earned && b.last ? (
        <>
          <span className="num mt-0.5 text-[18px] leading-tight">×{b.count}</span>
          <span className="text-[13px] leading-tight text-steel">{t(locale, "gecmis.last", { date: fmtDate(locale, b.last, "short") })}</span>
        </>
      ) : (
        <span className="mt-1 text-[13px] text-steel">{t(locale, "gecmis.notYet")}</span>
      )}
    </li>
  );
}

export default async function GecmisPage() {
  const h = await getCareerHistory();
  if (!h) redirect("/");
  const locale = await getLocale();

  // Vitrin dereceleri turnuva sonuçlarından, milli takım / klasman 1.liği başarılardan (yalnız okunur).
  const results = h.tournaments.map((tr) => ({ position: tr.position, level: tr.levelCode, dateMs: tr.dateMs, quarter: tr.quarter, order: tr.order }));
  const badges = buildShowcase(h.achievements, results);
  const timeline = buildTimeline(h.achievements);
  const goal = nextGoal(h.achievements, badges);

  return (
    <main>
      <h1 className="display text-[28px]">{t(locale, "gecmis.title")}</h1>

      {/* Kupa vitrini — koleksiyon: her rozet kaç kez + son kazanım; üst kademe hedefleri kilitli */}
      <section className="mt-3">
        <h2 className="display text-[22px]">{t(locale, "gecmis.showcase")}</h2>
        <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.showcaseNote")}</p>
        <ul className="mt-3 grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <BadgeTile key={b.key} b={b} locale={locale} />
          ))}
        </ul>
      </section>

      {/* İstatistikler */}
      <section className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
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

      {/* Kariyer zaman çizgisi — eskiden yeniye; dönüm noktaları vurgulu; sonda "sırada" hedefi */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "gecmis.timeline")}</h2>
        {timeline.length === 0 && <p className="mt-1 text-[14px] text-steel">{t(locale, "gecmis.noAchievements")}</p>}
        <ol className="mt-4 ml-4 border-l-2 border-line pl-6">
          {timeline.map((n, i) => (
            <li key={i} className="relative pb-5">
              <span
                className={`absolute top-0 -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border ${
                  n.milestone ? "border-prio bg-arena-0 text-prio" : "border-line bg-arena-1 text-ink"
                }`}
              >
                <Icon name={ACH_ICON[n.type] ?? "rating"} size={16} />
              </span>
              <div className="text-[13px] text-steel">{fmtDate(locale, n, "long")}</div>
              <div className="text-[15px] leading-snug">
                <span className="font-medium">{t(locale, `ach.${n.type}`)}</span>
                {n.detail ? <span className="text-steel"> — {n.detail}</span> : null}
              </div>
              {n.milestone && (
                <span className="kicker mt-1 inline-block rounded-md border border-prio px-1.5 text-prio">{t(locale, "gecmis.milestone")}</span>
              )}
            </li>
          ))}
          <li className="relative">
            <span className="absolute top-0 -left-[41px] flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-line bg-arena-0 text-steel">
              <Icon name="lock" size={16} />
            </span>
            <div className="kicker">{t(locale, "gecmis.next")}</div>
            <div className="text-[15px] text-steel">{t(locale, `gecmis.goal.${goal}`)}</div>
          </li>
        </ol>
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
