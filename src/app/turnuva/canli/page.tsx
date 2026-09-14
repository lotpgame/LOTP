import Link from "next/link";
import { redirect } from "next/navigation";
import {
  enterBracketAction,
  leaveLiveTournamentAction,
  playLiveMatchAction,
  revealPoolAction,
} from "@/app/actions";
import { TACTICS, TACTIC_DESC_TR, TACTIC_LABEL_TR } from "@/engine/combat";
import { getLiveTournament } from "@/server/careerService";
import { CanliMac } from "../[id]/CanliMac";
import { PulKagidi } from "../[id]/PulKagidi";
import { CanliPeriyot } from "./CanliPeriyot";

// Canlı turnuva: her istekte taze (DB durumuna bağlı).
export const dynamic = "force-dynamic";

const POSITION_LABEL: Record<number, string> = {
  1: "🥇 Şampiyon",
  2: "🥈 Finalist",
  3: "🥉 Yarı Final",
  5: "Çeyrek Final",
  9: "Son 16",
  17: "Son 32",
  33: "Son 64",
};
function positionLabel(pos: number | undefined): string {
  if (pos == null) return "—";
  return POSITION_LABEL[pos] ?? `${pos}. sıra`;
}

export default async function CanliTurnuvaPage() {
  const t = await getLiveTournament();
  if (!t) redirect("/kariyer"); // aktif turnuva yok

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.name}</h1>
          <p className="text-sm opacity-70">
            {t.categoryId} · {phaseLabel(t.phase)}
          </p>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-1.5 text-sm tabular-nums dark:border-white/15">
          Pul {Math.min(t.poolPlayed, t.poolTotal)}/{t.poolTotal}
        </div>
      </div>

      {/* Oyuncu durumu — turnuva boyunca güncel (kondisyon maçlarla düşer). */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🔋 Kondisyon</div>
          <div className="font-semibold tabular-nums">%{t.player.condition}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🎯 Keskinlik</div>
          <div className="font-semibold tabular-nums">%{t.player.sharpness}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">⭐ Güç</div>
          <div className="font-semibold tabular-nums">{t.player.overall.toFixed(1)}</div>
        </div>
      </div>

      {/* Oynanan maçların (canlı izlenebilir; en sonuncusu otomatik akar) */}
      {t.played.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Maçların</h2>
          <div className="mt-3 space-y-3">
            {t.played.map((m, i) => {
              const isCurrent = i === t.played.length - 1;
              // Pul maçının kaçıncısı olduğunu say (Pul 4 · 1. maç, 2. maç…).
              const poolMatchNo =
                m.phase === "POOL" ? t.played.slice(0, i + 1).filter((x) => x.phase === "POOL").length : 0;
              const label =
                m.phase === "POOL" ? `${m.round} · ${poolMatchNo}. maç` : `Eleme · ${m.round}`;
              return (
              <div key={i}>
                <div className="mb-1 text-xs font-medium opacity-60">
                  {m.timeLabel} · {label}
                </div>
                <CanliMac
                  aName={m.aName}
                  bName={m.bName}
                  scoreA={m.scoreA}
                  scoreB={m.scoreB}
                  log={m.log}
                  autoPlay={isCurrent}
                  past={!isCurrent}
                  afterDone={
                    t.poolAwaitingResult && isCurrent ? (
                      <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 p-4 text-center">
                        <h2 className="text-base font-semibold">Pul maçların bitti</h2>
                        <p className="mt-1 text-sm opacity-80">
                          Şimdi pul sıralamanı ve elemeye kaçıncı sıradan gireceğini gör.
                        </p>
                        <form action={revealPoolAction} className="mt-3">
                          <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
                            Pul sonuçlarını gör →
                          </button>
                        </form>
                      </div>
                    ) : undefined
                  }
                />
              </div>
              );
            })}
          </div>
        </section>
      )}

      {t.byes.length > 0 && (
        <div className="mt-4 space-y-1">
          {t.byes.map((b, i) => (
            <div key={i} className="rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-2 text-sm">
              {b.timeLabel} · <span className="font-medium">{b.round}</span>: BAY geçtin (üst sıralama).
            </div>
          ))}
        </div>
      )}

      {/* Devam eden eleme maçı — periyot akışı + devre arası taktik değişimi */}
      {t.liveMatch && (
        <section className="mt-6">
          <div className="mb-1 text-xs font-medium opacity-60">
            Eleme · {t.liveMatch.round} · {t.liveMatch.periodsPlayed}. periyot bitti
          </div>
          <CanliPeriyot
            key={t.liveMatch.log.length}
            aName="Sen"
            oppName={t.liveMatch.oppName}
            scoreHuman={t.liveMatch.scoreHuman}
            scoreOpp={t.liveMatch.scoreOpp}
            log={t.liveMatch.log}
            instantThrough={t.liveMatch.prevLen}
            afterDone={
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                <h2 className="text-lg font-semibold">
                  🔄 Devre arası — {t.liveMatch.nextPeriod}. periyot ({t.liveMatch.scoreHuman}-{t.liveMatch.scoreOpp})
                </h2>
                <p className="mt-1 text-sm opacity-70">
                  Sonraki periyot için taktiğini değiştirebilirsin. (Toplam {t.liveMatch.totalPeriods} periyot)
                </p>
                <form action={playLiveMatchAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {TACTICS.map((tac) => (
                    <button
                      key={tac}
                      name="tactic"
                      value={tac}
                      className="rounded-lg border border-black/15 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-500/10 dark:border-white/20"
                    >
                      <span className="text-sm font-medium">{TACTIC_LABEL_TR[tac]}</span>
                      <span className="mt-1 block text-xs opacity-70">{TACTIC_DESC_TR[tac]}</span>
                    </button>
                  ))}
                </form>
              </div>
            }
          />
        </section>
      )}

      {/* Sıradaki maç — taktik seç ve oyna */}
      {t.pending && (
        <section className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="text-sm opacity-70">
            {t.pending.timeLabel} ·{" "}
            {t.pending.phase === "POOL"
              ? `${t.pending.round}${t.pending.matchNo ? ` · ${t.pending.matchNo}. maç` : ""}`
              : `Eleme · ${t.pending.round}`}
          </div>
          <h2 className="mt-1 text-lg font-semibold">Sıradaki maç: {t.pending.oppName}</h2>
          <p className="mt-1 text-sm opacity-70">
            {t.pending.phase === "DE"
              ? "1. periyot için taktiğini seç — eleme maçı 3 periyota (3×3 dk) kadar; her devre arası taktik değiştirebilirsin."
              : "Bu maç için taktiğini seç — maç hemen başlar. (Her maçın kendi taktiği vardır.)"}
          </p>
          <form action={playLiveMatchAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {TACTICS.map((tac) => (
              <button
                key={tac}
                name="tactic"
                value={tac}
                className="rounded-lg border border-black/15 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-500/10 dark:border-white/20"
              >
                <span className="text-sm font-medium">{TACTIC_LABEL_TR[tac]}</span>
                <span className="mt-1 block text-xs opacity-70">{TACTIC_DESC_TR[tac]}</span>
              </button>
            ))}
          </form>
        </section>
      )}

      {/* Pul aşamasında kilitli sıradaki maçlar */}
      {t.phase === "POOL" && !t.poolAwaitingResult && t.upcoming.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold opacity-70">Sıradaki pul maçların (kilitli)</h3>
          <ul className="mt-2 space-y-1">
            {t.upcoming.map((u, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-black/10 px-3 py-2 text-sm opacity-50 dark:border-white/15"
              >
                <span>🔒 vs {u.oppName}</span>
                <span className="tabular-nums">{u.timeLabel}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Pul bitti → sıralama + elemeye geç */}
      {t.phase === "POOL_DONE" && (
        <section className="mt-6 rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
          <h2 className="text-lg font-semibold">Pul aşaması bitti</h2>
          <p className="mt-1 text-sm opacity-80">
            Pul sıralaman: <span className="font-semibold">{t.seedRank}. sıra</span> — bu sıralamayla
            eleme tablosuna girersin.
          </p>
          <form action={enterBracketAction} className="mt-3">
            <button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500">
              Elemeye Geç →
            </button>
          </form>
        </section>
      )}

      {/* Pul kağıtları (poule) — pul bitince görünür */}
      {t.poolSheets && t.poolSheets.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Pul Kağıtları</h2>
          <p className="mt-1 text-xs opacity-60">V5 = galibiyet (attığın tuş) · sayı = mağlubiyette attığın tuş.</p>
          <div className="mt-3 space-y-5">
            {t.poolSheets.map((sheet) => (
              <PulKagidi key={sheet.poolNumber} sheet={sheet} />
            ))}
          </div>
        </section>
      )}

      {/* Turnuva bitti — sonuç + klasman */}
      {t.phase === "DONE" && (
        <section className="mt-8">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <div className="text-sm opacity-70">🏁 Turnuva bitti — senin sonucun</div>
            <div className="mt-1 text-3xl font-bold">{positionLabel(t.finalPosition)}</div>
            <div className="mt-1 text-sm opacity-70">Şampiyon: {t.championName}</div>
          </div>

          {/* Klasman (genel puanlama) */}
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
              <div className="text-xs opacity-60">Kazanılan puan</div>
              <div className="font-semibold text-emerald-600">
                {t.earnedPoints != null && t.earnedPoints > 0 ? `+${t.earnedPoints}` : "0"}
              </div>
            </div>
            <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
              <div className="text-xs opacity-60">Klasman sıran</div>
              <div className="font-semibold">{t.newRank != null ? `#${t.newRank}` : "—"}</div>
            </div>
          </div>
          <p className="mt-1 text-center text-xs opacity-50">
            Quarter Ranking puanı (quarter sonunda sıfırlanır).
          </p>

          {t.standings && (
            <ol className="mt-4 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
              {t.standings.slice(0, 8).map((s, i) => (
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
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <form action={leaveLiveTournamentAction}>
              <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
                🏠 Eve Dön
              </button>
            </form>
            {t.finalTournamentId != null && (
              <Link
                href={`/turnuva/${t.finalTournamentId}`}
                className="rounded-lg border border-black/15 px-4 py-3 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
              >
                Tüm tabloyu gör
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case "POOL":
      return "Pul aşaması";
    case "POOL_DONE":
      return "Pul bitti";
    case "DE":
      return "Eleme";
    case "DONE":
      return "Bitti";
    default:
      return phase;
  }
}
