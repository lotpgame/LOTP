import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveLiveTournamentAction } from "@/app/actions";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";

const POSITION_LABEL: Record<number, string> = {
  1: "🥇 Şampiyon",
  2: "🥈 Finalist",
  3: "🥉 Yarı Final",
  5: "Çeyrek Final",
  9: "Son 16",
  17: "Son 32",
  33: "Son 64",
};

function positionLabel(pos: number): string {
  return POSITION_LABEL[pos] ?? `${pos}. sıra`;
}

export default async function TurnuvaPage({ params }: PageProps<"/turnuva/[id]">) {
  const { id } = await params;
  const t = await getTournament(Number(id));
  if (!t) notFound();

  // Eleme turlarını göründükleri sırada grupla (Son 32 → … → Final).
  const deRounds: string[] = [];
  for (const m of t.matches) {
    if (m.phase === "DE" && !deRounds.includes(m.round)) deRounds.push(m.round);
  }
  const yourMatches = t.matches.filter((m) => m.aIsHuman || m.bIsHuman);
  const yourPool = yourMatches.filter((m) => m.phase === "POOL");
  const yourDE = yourMatches.filter((m) => m.phase === "DE");
  // Bay (bye): pul sıralaman yüksekse ilk eleme tur(lar)ını oynamadan geçersin (GDD 17.55).
  const firstDeRound = yourDE[0]?.round;
  const hadBye = firstDeRound != null && deRounds.length > 0 && firstDeRound !== deRounds[0];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link href="/kariyer" className="text-sm text-emerald-600 hover:underline">
        ← Kariyere dön
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{t.name}</h1>
      <p className="text-sm opacity-70">{t.categoryId}</p>

      {/* Senin maçların — önce pul, sonra pul sıralaman, sonra eleme; canlı izlenebilir */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Senin Maçların</h2>
        <p className="text-sm opacity-70">
          Önce pul (grup) maçların; pul bitince sıralamanı görürsün, elemeye kalırsan o maçları da
          izlersin. Sonucu görmeden canlı takip edebilirsin.
        </p>

        {yourPool.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold opacity-70">1) Pul maçların</h3>
            <div className="mt-2 space-y-3">
              {yourPool.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">{m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} />
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pul sonrası sıralama — elemeye hangi seed'den girdiğini gösterir */}
        {t.yourSeedRank != null && (
          <div className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 p-3 text-sm">
            <span className="font-medium">2) Pul sonucu:</span> Pul aşamasını{" "}
            <span className="font-semibold">{t.yourSeedRank}. sıradan</span> tamamladın → eleme
            tablosuna bu sıralamayla girdin.
            {hadBye && (
              <>
                {" "}
                Sıralaman yüksek olduğu için <span className="font-semibold">{deRounds[0]}</span> turunu{" "}
                <span className="font-semibold">bay (bye)</span> geçtin; ilk maçın{" "}
                <span className="font-semibold">{firstDeRound}</span>.
              </>
            )}
          </div>
        )}

        {yourDE.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold opacity-70">3) Eleme maçların</h3>
            <div className="mt-2 space-y-3">
              {yourDE.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">Eleme · {m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="text-sm opacity-70">Turnuva sonucun</div>
        <div className="text-xl font-semibold">{positionLabel(t.yourPosition)}</div>
        <div className="mt-1 text-sm opacity-70">
          {t.yourSeedRank ? `Pul sonrası ${t.yourSeedRank}. sıradan elemeye girdin. ` : ""}
          Şampiyon: {t.championName}
        </div>
      </div>

      {/* Pul'lar (grup) */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Pul&apos;lar (Grup)</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {t.pools.map((pool) => (
            <div key={pool.poolNumber} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
              <h3 className="mb-2 text-sm font-medium opacity-80">Pul {pool.poolNumber}</h3>
              <ul className="space-y-1 text-sm">
                {pool.players.map((p, i) => (
                  <li
                    key={i}
                    className={`flex items-center justify-between rounded px-1 ${
                      p.isHuman ? "bg-emerald-500/10 font-medium" : ""
                    }`}
                  >
                    <span className="truncate">
                      {p.name}
                      {p.isHuman ? " (sen)" : ""}
                    </span>
                    <span className="ml-2 shrink-0 tabular-nums opacity-70">
                      {p.wins}G-{p.losses}M · {p.indicator >= 0 ? "+" : ""}
                      {p.indicator}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Eleme */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Eleme Tablosu</h2>
        <div className="mt-3 space-y-6">
          {deRounds.map((round) => (
            <div key={round}>
              <h3 className="mb-2 text-sm font-medium opacity-80">{round}</h3>
              <ul className="space-y-1">
                {t.matches
                  .filter((m) => m.phase === "DE" && m.round === round)
                  .map((m, i) => {
                    const aWon = m.scoreA >= m.scoreB;
                    const mine = m.aIsHuman || m.bIsHuman;
                    return (
                      <li
                        key={i}
                        className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                          mine ? "bg-emerald-500/10" : ""
                        }`}
                      >
                        <span className={aWon ? "font-medium" : "opacity-70"}>{m.aName}</span>
                        <span className="tabular-nums">
                          {m.scoreA} – {m.scoreB}
                        </span>
                        <span className={!aWon ? "font-medium" : "opacity-70"}>{m.bName}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Nihai sıralama */}
      <FinalStandings standings={t.standings} />

      {/* Alt çıkış — uzun tablodan sonra tekrar kariyere dön */}
      <div className="mt-8 flex justify-center">
        <form action={leaveLiveTournamentAction}>
          <button className="rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            🏠 Kariyere Dön
          </button>
        </form>
      </div>
    </main>
  );
}

function FinalStandings({ standings }: { standings: TournamentResultDTO["standings"] }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Turnuva Sıralaması</h2>
      <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
        {standings.map((s, i) => (
          <li
            key={i}
            className={`flex items-center justify-between px-3 py-2 text-sm ${
              s.isHuman ? "bg-emerald-500/10 font-medium" : ""
            }`}
          >
            <span>
              {s.name}
              {s.isHuman ? " (sen)" : ""}
            </span>
            <span className="opacity-70">{positionLabel(s.position)}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
