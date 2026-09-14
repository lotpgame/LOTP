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

      {/* Oynanan maçların (canlı izlenebilir; en sonuncusu otomatik akar) */}
      {t.played.length > 0 && (
        <section className="mt-6">
          <h2 className="text-lg font-semibold">Maçların</h2>
          <div className="mt-3 space-y-3">
            {t.played.map((m, i) => (
              <div key={i}>
                <div className="mb-1 text-xs font-medium opacity-60">
                  {m.timeLabel} · {m.phase === "POOL" ? m.round : `Eleme · ${m.round}`}
                </div>
                <CanliMac
                  aName={m.aName}
                  bName={m.bName}
                  scoreA={m.scoreA}
                  scoreB={m.scoreB}
                  log={m.log}
                  autoPlay={i === t.played.length - 1}
                />
              </div>
            ))}
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
          />
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
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
        </section>
      )}

      {/* Sıradaki maç — taktik seç ve oyna */}
      {t.pending && (
        <section className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
          <div className="text-sm opacity-70">
            {t.pending.timeLabel} · {t.pending.phase === "POOL" ? t.pending.round : `Eleme · ${t.pending.round}`}
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

      {/* Pul maçları bitti — son maçı izledikten sonra sonucu aç */}
      {t.poolAwaitingResult && (
        <section className="mt-6 rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-center">
          <h2 className="text-lg font-semibold">Pul maçların bitti</h2>
          <p className="mt-1 text-sm opacity-80">
            Son maçını izledikten sonra pul sıralamanı ve elemeye kaçıncı sıradan gireceğini gör.
          </p>
          <form action={revealPoolAction} className="mt-3">
            <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
              Pul sonuçlarını gör →
            </button>
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

      {/* Pul tabloları (pul bitince görünür) */}
      {t.pools && t.pools.length > 0 && (
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
