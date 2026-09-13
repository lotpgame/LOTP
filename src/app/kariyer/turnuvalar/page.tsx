import Link from "next/link";
import { redirect } from "next/navigation";
import { getCareer } from "@/server/careerService";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const weekly = c.seasonCalendar.filter((e) => e.month === 0);
  const international = c.seasonCalendar.filter((e) => e.month > 0).sort((a, b) => a.month - b.month);

  return (
    <main>
      <h1 className="text-xl font-bold">Turnuvalar</h1>
      <p className="mt-1 text-sm opacity-70">
        Program her ay (h1–h12) tekrar eder. Turnuvaya kaydolmazsın — turnuva günü gelince alttaki{" "}
        <b>İlerle</b> seni orada durdurur, <b>Katıl</b> ile canlı oynarsın.
      </p>

      <section className="mt-4">
        <h2 className="text-sm font-semibold opacity-80">Her ay (yurt içi)</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {weekly.map((e) => (
            <li
              key={e.level}
              className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/15"
            >
              <span className="min-w-0">
                <span className="font-medium">{e.label}</span>
                <span className="ml-2 text-xs opacity-60">{e.dayName}</span>
              </span>
              <span className="shrink-0 text-xs opacity-60">Herkese açık</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-5">
        <h2 className="text-sm font-semibold opacity-80">Uluslararası (yılda 1)</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {international.map((e) => (
            <li
              key={e.level}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm ${
                e.qualified
                  ? "border-black/10 dark:border-white/15"
                  : "border-black/10 opacity-60 dark:border-white/15"
              }`}
            >
              <span className="min-w-0">
                <span className="font-medium">{e.label}</span>
                <span className="ml-2 text-xs opacity-60">
                  h{e.month} · {e.dayName}
                </span>
              </span>
              <span className="shrink-0 text-xs">{e.qualified ? "✓ uygunsun" : `🔒 ${e.requirement}`}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs opacity-50">
          Uluslararası davetler <b>Klasman</b>&apos;a göre belirlenir (ilk 16 / milli takım ilk 4).{" "}
          <Link href="/kariyer/klasman" className="text-emerald-600 hover:underline">
            Klasmana bak →
          </Link>
        </p>
      </section>
    </main>
  );
}
