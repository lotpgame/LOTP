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
  const catName = `${t(locale, "country.TR")} ${t(locale, `gender.${c.gender}`)} ${t(locale, `weapon.${c.weapon}`)} ${ageCat}`;

  return (
    <main>
      <h1 className="text-xl font-bold">{t(locale, "klasman.title")}</h1>
      <p className="mt-1 text-sm">
        {myRank != null
          ? t(locale, "klasman.ownRank", { cat: catName, n: myRank })
          : t(locale, "klasman.noRank", { cat: catName })}
      </p>
      <p className="mt-1 text-xs opacity-60">{t(locale, "klasman.note")}</p>

      <section className="mt-4 grid grid-cols-3 gap-2.5">
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "klasman.rank")}</div>
          <div className="font-semibold">{myRank != null ? `#${myRank}` : "—"}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "common.nationalTeam")}</div>
          <div className={`font-semibold ${c.nationalTeam ? "text-emerald-600" : ""}`}>
            {c.nationalTeam ? t(locale, "klasman.nt4") : "—"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "klasman.intl")}</div>
          <div className={`font-semibold ${myRank != null && myRank <= 16 ? "text-emerald-600" : ""}`}>
            {myRank != null && myRank <= 16 ? t(locale, "klasman.intl16") : "—"}
          </div>
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold opacity-80">{t(locale, "klasman.rankings")}</h2>
        <p className="mb-2 text-xs opacity-60">{t(locale, "klasman.filterHint")}</p>
        <KlasmanFilter initialCategoryId={c.categoryId} initialRows={c.ranking} locale={locale} />
      </section>

      <p className="mt-4 rounded-lg border border-dashed border-black/15 p-3 text-xs opacity-60 dark:border-white/20">
        {t(locale, "klasman.worldNote")}
      </p>
    </main>
  );
}
