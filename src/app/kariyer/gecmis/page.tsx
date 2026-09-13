import Link from "next/link";
import { redirect } from "next/navigation";
import { getCareerHistory } from "@/server/careerService";

export const dynamic = "force-dynamic";

export default async function GecmisPage() {
  const h = await getCareerHistory();
  if (!h) redirect("/");

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <Link href="/kariyer" className="text-sm text-emerald-600 hover:underline">
        ← Kariyere dön
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{h.name} — Kariyer Geçmişi</h1>

      {/* İstatistikler */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Turnuva" value={h.stats.totalTournaments} />
        <Stat label="Şampiyonluk" value={h.stats.championships} />
        <Stat label="Madalya" value={h.stats.medals} />
        <Stat label="Final" value={h.stats.finals} />
        <Stat label="Maç" value={h.stats.matchesPlayed} />
        <Stat label="Galibiyet" value={h.stats.matchWins} />
        <Stat
          label="En İyi Ranking"
          value={h.stats.careerBestRank != null ? `#${h.stats.careerBestRank}` : "—"}
        />
      </section>

      {/* Başarılar */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Başarılar</h2>
        {h.achievements.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">Henüz başarı yok. Turnuvalara katıl!</p>
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
                  {new Date(a.date).toLocaleDateString("tr-TR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Rakiplikler */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Rakiplikler</h2>
        {h.rivals.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">Henüz yeterli maç yok.</p>
        ) : (
          <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
            {h.rivals.map((r, i) => (
              <li key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>{r.name}</span>
                <span className="tabular-nums opacity-70">
                  {r.matches} maç · {r.wins}G-{r.losses}M
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
