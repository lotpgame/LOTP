import Link from "next/link";
import { notFound } from "next/navigation";
import { leaveLiveTournamentAction } from "@/app/actions";
import { getTournament, type TournamentResultDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";
import { PulKagidi } from "./PulKagidi";

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
          Önce pul (grup) maçların, sonra eleme maçların. Her maçta{" "}
          <span className="font-medium">📋 Skor detayı</span> ile tuş-tuş dökümü açabilirsin.
        </p>

        {yourPool.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-semibold opacity-70">1) Pul maçların</h3>
            <div className="mt-2 space-y-3">
              {yourPool.map((m, i) => (
                <div key={i}>
                  <div className="mb-1 text-xs font-medium opacity-60">{m.round}</div>
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past />
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
                  <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past />
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

      {/* Pul kağıtları (poule) */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Pul Kağıtları</h2>
        <p className="mt-1 text-xs opacity-60">
          V5 = galibiyet (attığın tuş) · sayı = mağlubiyette attığın tuş · V: galibiyet, TS/TR: atılan/yenen
          tuş, Ind: averaj.
        </p>
        <div className="mt-3 space-y-5">
          {t.poolSheets.map((sheet) => (
            <PulKagidi key={sheet.poolNumber} sheet={sheet} />
          ))}
        </div>
      </section>

      {/* Eleme çatalı (bracket) — turlar sütun sütun, sağa doğru finale gider */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Eleme Çatalı</h2>
        <div className="mt-3 overflow-x-auto pb-2">
          <div className="flex min-w-max gap-3">
            {deRounds.map((round) => (
              <div key={round} className="flex min-w-[170px] flex-col justify-around gap-3">
                <h3 className="text-center text-xs font-medium opacity-70">{round}</h3>
                {t.matches
                  .filter((m) => m.phase === "DE" && m.round === round)
                  .map((m, i) => {
                    const aWon = m.scoreA >= m.scoreB;
                    const mine = m.aIsHuman || m.bIsHuman;
                    return (
                      <div
                        key={i}
                        className={`rounded-lg border p-2 text-xs ${
                          mine
                            ? "border-emerald-500/50 bg-emerald-500/10"
                            : "border-black/10 dark:border-white/15"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`truncate ${aWon ? "font-semibold" : "opacity-60"}`}>{m.aName}</span>
                          <span className="tabular-nums opacity-80">{m.scoreA}</span>
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`truncate ${!aWon ? "font-semibold" : "opacity-60"}`}>{m.bName}</span>
                          <span className="tabular-nums opacity-80">{m.scoreB}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
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
