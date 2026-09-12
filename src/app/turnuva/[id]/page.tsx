import Link from "next/link";
import { notFound } from "next/navigation";
import { getTournament } from "@/server/careerService";

const POSITION_LABEL: Record<number, string> = {
  1: "🥇 Şampiyon",
  2: "🥈 Finalist",
  3: "🥉 Yarı Final",
  5: "Çeyrek Final",
};

function positionLabel(pos: number): string {
  return POSITION_LABEL[pos] ?? `${pos}. sıra`;
}

export default async function TurnuvaPage({ params }: PageProps<"/turnuva/[id]">) {
  const { id } = await params;
  const t = await getTournament(Number(id));
  if (!t) notFound();

  const rounds = ["Çeyrek Final", "Yarı Final", "Final"];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <Link href="/kariyer" className="text-sm text-emerald-600 hover:underline">
        ← Kariyere dön
      </Link>

      <h1 className="mt-2 text-2xl font-bold">{t.name}</h1>
      <p className="text-sm opacity-70">{t.categoryId}</p>

      <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="text-sm opacity-70">Senin sonucun</div>
        <div className="text-xl font-semibold">{positionLabel(t.yourPosition)}</div>
        <div className="mt-1 text-sm opacity-70">Şampiyon: {t.championName}</div>
      </div>

      {/* Maçlar */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Maçlar</h2>
        <div className="mt-3 space-y-6">
          {rounds.map((round) => {
            const roundMatches = t.matches.filter((m) => m.round === round);
            if (roundMatches.length === 0) return null;
            return (
              <div key={round}>
                <h3 className="mb-2 text-sm font-medium opacity-80">{round}</h3>
                <div className="space-y-3">
                  {roundMatches.map((m, i) => {
                    const aWon = m.scoreA >= m.scoreB;
                    return (
                      <div
                        key={i}
                        className="rounded-lg border border-black/10 p-3 dark:border-white/15"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className={aWon ? "font-semibold" : "opacity-70"}>{m.aName}</span>
                          <span className="tabular-nums">
                            {m.scoreA} – {m.scoreB}
                          </span>
                          <span className={!aWon ? "font-semibold" : "opacity-70"}>{m.bName}</span>
                        </div>
                        <ul className="mt-2 space-y-0.5 text-xs opacity-70">
                          {m.log.map((line, j) => (
                            <li key={j}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Nihai sıralama */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Turnuva Sıralaması</h2>
        <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {t.standings.map((s, i) => (
            <li
              key={i}
              className={`flex items-center justify-between px-3 py-2 text-sm ${
                s.isHuman ? "bg-emerald-500/10 font-medium" : ""
              }`}
            >
              <span>{s.name}{s.isHuman ? " (sen)" : ""}</span>
              <span className="opacity-70">{positionLabel(s.position)}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
