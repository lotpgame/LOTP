import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <Link href="/kariyer" className="text-sm text-emerald-600 hover:underline">
        ← Kariyere dön
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{t.name}</h1>
      <p className="text-sm opacity-70">{t.categoryId}</p>

      {/* Senin maçların — havuz + eleme, sırayla, canlı izlenebilir */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Senin Maçların</h2>
        <p className="text-sm opacity-70">
          Havuz maçlarından başla; elemeye kalırsan o maçları da izle. Sonucu görmeden canlı
          takip edebilirsin.
        </p>
        <div className="mt-3 space-y-3">
          {yourMatches.map((m, i) => (
            <div key={i}>
              <div className="mb-1 text-xs font-medium opacity-60">
                {m.phase === "POOL" ? m.round : `Eleme · ${m.round}`}
              </div>
              <CanliMac
                aName={m.aName}
                bName={m.bName}
                scoreA={m.scoreA}
                scoreB={m.scoreB}
                log={m.log}
              />
            </div>
          ))}
        </div>
      </section>

      <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="text-sm opacity-70">Turnuva sonucun</div>
        <div className="text-xl font-semibold">{positionLabel(t.yourPosition)}</div>
        <div className="mt-1 text-sm opacity-70">
          {t.yourSeedRank ? `Havuz sonrası ${t.yourSeedRank}. sıradan elemeye girdin. ` : ""}
          Şampiyon: {t.championName}
        </div>
      </div>

      {/* Havuzlar */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Havuzlar</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {t.pools.map((pool) => (
            <div key={pool.poolNumber} className="rounded-lg border border-black/10 p-3 dark:border-white/15">
              <h3 className="mb-2 text-sm font-medium opacity-80">Havuz {pool.poolNumber}</h3>
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
