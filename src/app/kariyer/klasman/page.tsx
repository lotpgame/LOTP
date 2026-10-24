import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { KlasmanFilter } from "./KlasmanFilter";

export const dynamic = "force-dynamic";

export default async function KlasmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  const myRank = c.ranking.find((r) => r.isHuman)?.position ?? null;
  const ageCat = c.categoryId.split("-")[0];
  const catName = `${t(locale, `country.${c.countryCode}`)} ${t(locale, `gender.${c.gender}`)} ${t(locale, `weapon.${c.weapon}`)} ${ageCat}`;
  const intl = myRank != null && myRank <= 4; // uluslararası uygunluk = ülkenin ilk 4'ü (milli takımla aynı)

  return (
    <main className="flex flex-col gap-4">
      <h1 className="display text-[28px]">{t(locale, "klasman.title")}</h1>

      {/* Senin durumun: sıra + iki kapı (milli takım ilk 4 · uluslararası ilk 16) */}
      <section className="panel p-4">
        <div className="kicker">{catName}</div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div>
            <div className="num text-[44px] leading-none">{myRank != null ? `#${myRank}` : "—"}</div>
            <div className="mt-1 text-[13px] text-steel">
              {myRank != null ? t(locale, "klasman.rank") : t(locale, "klasman.noRankShort")}
            </div>
          </div>
          <ul className="flex flex-col gap-1.5 text-[14px]">
            <li className="flex items-center gap-2">
              <span className={`lamp h-2.5 w-2.5 ${c.nationalTeam ? "lamp-prio" : "bg-line"}`} aria-hidden="true" />
              {t(locale, "klasman.gateNt")}
            </li>
            <li className="flex items-center gap-2">
              <span className={`lamp h-2.5 w-2.5 ${intl ? "lamp-prio" : "bg-line"}`} aria-hidden="true" />
              {t(locale, "klasman.gateIntl")}
            </li>
          </ul>
        </div>
        <p className="mt-3 text-[13px] text-steel">{t(locale, "klasman.note")}</p>
      </section>

      <section>
        <h2 className="kicker mb-2">{t(locale, "klasman.rankings")}</h2>
        <KlasmanFilter initialCategoryId={c.categoryId} initialRows={c.ranking} countryCode={c.countryCode} locale={locale} />
      </section>
    </main>
  );
}
