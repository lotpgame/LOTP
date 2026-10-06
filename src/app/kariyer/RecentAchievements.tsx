/**
 * "Son başarılar" şeridi (Bugün ekranı, docs/GORSEL_ETKILESIM.md §8): en yeni rozetler, kupa vitriniyle aynı rozet
 * dili; son 3 günde kazanılan "Yeni" etiketli ve kısa bir parıltıyla açılır (hareketi azalt açıkken parıltı yok).
 * Başarı yoksa şerit hiç gösterilmez.
 */
import Link from "next/link";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { ACH_ICON, ACH_TONE, NEUTRAL_DISC } from "@/app/ui/achievementBadge";

const DATE_LOCALE: Partial<Record<Locale, string>> = { en: "en-GB", de: "de-DE" };

export function RecentAchievements({
  items,
  locale,
}: {
  items: { type: string; dateMs: number | null; quarter: number; isNew: boolean }[];
  locale: Locale;
}) {
  if (items.length === 0) return null;
  return (
    <section className="panel px-4 pt-1 pb-3">
      <Link href="/kariyer/gecmis" className="flex min-h-11 items-center justify-between gap-2 rounded-md active:bg-arena-2">
        <span className="kicker">{t(locale, "bugun.recent")}</span>
        <span className="inline-flex items-center gap-0.5 text-[13px] text-steel">
          {t(locale, "bugun.recentAll")}
          <Icon name="chevron-right" size={16} />
        </span>
      </Link>
      <ul className="flex snap-x gap-2 overflow-x-auto pb-1">
        {items.map((a, i) => (
          <li key={i} className="flex w-[84px] shrink-0 snap-start flex-col items-center text-center">
            <span
              className={`fx-shine relative flex h-11 w-11 items-center justify-center rounded-full border border-line ${
                ACH_TONE[a.type] ?? NEUTRAL_DISC
              } ${a.isNew ? "anim-shine" : ""}`}
            >
              <Icon name={ACH_ICON[a.type] ?? "rating"} size={20} />
            </span>
            <span className="mt-1.5 line-clamp-2 text-[13px] leading-tight">{t(locale, `ach.${a.type}`)}</span>
            {a.isNew ? (
              <span className="kicker mt-0.5 text-ink">{t(locale, "bugun.new")}</span>
            ) : (
              <span className="mt-0.5 text-[13px] text-steel">
                {a.dateMs != null
                  ? new Date(a.dateMs).toLocaleDateString(DATE_LOCALE[locale] ?? "tr-TR", { timeZone: "UTC", day: "numeric", month: "short" })
                  : `Q${a.quarter}`}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
