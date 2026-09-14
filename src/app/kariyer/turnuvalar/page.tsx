import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);
  const intlByMonth = new Map(c.seasonCalendar.filter((e) => e.month > 0).map((e) => [e.month, e]));
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <main>
      <h1 className="text-xl font-bold">{t(locale, "turnuvalar.title")}</h1>
      <p className="mt-1 text-sm opacity-70">{t(locale, "turnuvalar.intro")}</p>

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
