import Link from "next/link";
import { redirect } from "next/navigation";
import { getCareerHistory } from "@/server/careerService";

export const dynamic = "force-dynamic";

const POSITION_BADGE: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

function placementLabel(pos: number): string {
  if (pos === 0) return "—";
  return POSITION_BADGE[pos] ? `${POSITION_BADGE[pos]} ${pos}.` : `${pos}.`;
}

export default async function GecmisPage() {
  const h = await getCareerHistory();
  if (!h) redirect("/");

  return (
    <main>
      <h1 className="text-xl font-bold">📜 Kariyer Geçmişi</h1>

      {/* İstatistikler */}
      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="🏟" label="Turnuva" value={h.stats.totalTournaments} />
        <Stat icon="🥇" label="Şampiyonluk" value={h.stats.championships} />
        <Stat icon="🎖" label="Madalya" value={h.stats.medals} />
        <Stat icon="🏅" label="Final" value={h.stats.finals} />
        <Stat icon="🤺" label="Maç" value={h.stats.matchesPlayed} />
        <Stat icon="✅" label="Galibiyet" value={h.stats.matchWins} />
        <Stat
          icon="📈"
          label="En İyi Ranking"
          value={h.stats.careerBestRank != null ? `#${h.stats.careerBestRank}` : "—"}
        />
      </section>

      {/* Oynanan turnuvalar — maçları yeniden izlemek için tıkla */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">🏟 Turnuvalarım</h2>
        {h.tournaments.length === 0 ? (
          <p className="mt-1 text-sm opacity-60">Henüz turnuva oynamadın.</p>
        ) : (
          <>
            <p className="mt-1 text-sm opacity-60">
              Bir turnuvaya dokun → pul ve eleme maçlarını yeniden izle.
            </p>
            <ul className="mt-3 space-y-2">
              {h.tournaments.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/turnuva/${t.id}`}
                    className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2.5 text-sm transition hover:border-emerald-500/40 hover:bg-emerald-500/5 dark:border-white/15 dark:bg-white/[0.02]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{t.name}</span>
                      <span className="text-xs opacity-50">
                        {t.level} · {new Date(t.date).toLocaleDateString("tr-TR")}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          t.position >= 1 && t.position <= 3
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                            : "bg-black/10 opacity-70 dark:bg-white/15"
                        }`}
                      >
                        {placementLabel(t.position)}
                      </span>
                      <span className="opacity-40">›</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
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

function Stat({ label, value, icon }: { label: string; value: string | number; icon?: string }) {
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 dark:border-white/15 dark:bg-white/[0.02]">
      <div className="flex items-center gap-1 text-xs opacity-60">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );
}
