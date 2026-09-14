import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";

export const dynamic = "force-dynamic";

const MAX_LEVEL = 5;

export default async function EkipmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t(locale, "ekipman.title")}</h1>
        <span className="rounded-lg border border-black/10 px-3 py-1 text-sm dark:border-white/15">
          💰 {c.balance.toFixed(0)} ₺
        </span>
      </div>

      <section className="mt-4 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-80">{t(locale, "ekipman.level")}</span>
          <span className="font-semibold">
            {c.equipmentLevel}/{MAX_LEVEL}
          </span>
        </div>
        <div className="mt-3 flex gap-1.5">
          {Array.from({ length: MAX_LEVEL }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-full ${i < c.equipmentLevel ? "bg-emerald-500" : "bg-black/10 dark:bg-white/15"}`}
            />
          ))}
        </div>
        <p className="mt-3 text-xs opacity-60">{t(locale, "ekipman.levelNote")}</p>
      </section>

      {/* İleride: mağaza (kordon, maske, silah markaları…) */}
      <section className="mt-4 rounded-xl border border-dashed border-black/15 p-4 text-center text-sm opacity-60 dark:border-white/20">
        {t(locale, "ekipman.marketNote")}
      </section>
    </main>
  );
}
