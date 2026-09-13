import { redirect } from "next/navigation";
import { registerAction } from "@/app/actions";
import { getCareer } from "@/server/careerService";
import { RankingTable } from "../parts";

export const dynamic = "force-dynamic";

export default async function TurnuvalarPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  return (
    <main>
      <h1 className="text-xl font-bold">Turnuvalar</h1>
      <p className="mt-1 text-sm opacity-70">
        Katıl&apos;a bas → kaydolursun. O hafta gelince Antrenman sekmesinden &quot;Haftayı İlerle&quot;
        seni turnuvaya götürür. Uluslararası organizasyonlar Quarter Ranking&apos;e göre davetlidir.
      </p>

      <section className="mt-4">
        <h2 className="text-sm font-semibold opacity-80">Yaklaşan Turnuvalar (Q{c.quarter})</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {c.upcomingTournaments.map((e) => {
            const key = `${e.weekIndex}-${e.level}`;
            const rowInfo = (
              <span className="min-w-0">
                <span className="font-medium">{e.label}</span>
                <span className="ml-2 text-xs opacity-60">
                  {e.dateLabel} · H{e.weekInQuarter}/12
                </span>
              </span>
            );
            if (e.registered) {
              return (
                <li key={key} className="flex items-center justify-between rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm">
                  {rowInfo}
                  <span className="shrink-0 text-xs font-medium text-emerald-600">✓ Kayıtlısın</span>
                </li>
              );
            }
            if (e.past) {
              return (
                <li key={key} className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm opacity-40 dark:border-white/15">
                  {rowInfo}
                  <span className="shrink-0 text-xs">geçti</span>
                </li>
              );
            }
            if (!e.qualified) {
              return (
                <li key={key} className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-3 text-sm opacity-60 dark:border-white/15">
                  {rowInfo}
                  <span className="shrink-0 text-xs">🔒 {e.requirement}</span>
                </li>
              );
            }
            return (
              <li key={key} className="flex items-center justify-between gap-2 rounded-lg border border-black/10 px-4 py-3 text-sm dark:border-white/15">
                {rowInfo}
                {c.registration ? (
                  <span className="shrink-0 text-xs opacity-50">önce mevcut kaydı iptal et</span>
                ) : (
                  <form action={registerAction} className="shrink-0">
                    <input type="hidden" name="level" value={e.level} />
                    <input type="hidden" name="weekIndex" value={e.weekIndex} />
                    <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-500">
                      Katıl →
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-6">
        <RankingTable ranking={c.ranking} quarter={c.quarter} />
      </section>
    </main>
  );
}
