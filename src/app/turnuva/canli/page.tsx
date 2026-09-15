import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { advanceLiveStageAction, leaveLiveTournamentAction, playLiveMatchAction } from "@/app/actions";
import { TACTICS } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getLiveTournament, type LiveTournamentDTO } from "@/server/careerService";
import { CanliMac } from "../[id]/CanliMac";
import { PulKagidi } from "../[id]/PulKagidi";
import { CanliPeriyot } from "./CanliPeriyot";
import { Countdown } from "./Countdown";
import { TournamentTabs } from "./TournamentTabs";

// Canlı turnuva: her istekte taze (DB durumuna bağlı).
export const dynamic = "force-dynamic";

const WAIT_SECONDS = 10; // maç bitince sonraki aşamadan önce sabit bekleme (kullanıcı tercihi)

// Aşama sırası → hangi sekme "canlı" ve hangi sekmeler açık.
const STAGE_ORDER: Record<string, number> = {
  POOL_INTRO: 0,
  POOL: 1,
  WAIT_POOL: 2,
  POOL_RESULT: 3,
  STANDINGS: 4,
  KO_DRAW: 5,
  DE: 6,
  WAIT_DE: 7,
  DONE: 8,
};

function positionLabel(locale: Locale, pos: number | undefined): string {
  if (pos == null) return "—";
  switch (pos) {
    case 1:
      return t(locale, "pos.champion");
    case 2:
      return t(locale, "pos.finalist");
    case 3:
      return t(locale, "pos.semi");
    case 5:
      return t(locale, "pos.quarter");
    case 9:
      return t(locale, "round.last", { n: 16 });
    case 17:
      return t(locale, "round.last", { n: 32 });
    case 33:
      return t(locale, "round.last", { n: 64 });
    default:
      return t(locale, "pos.nth", { n: pos });
  }
}

/** Son periyot başlığının log indeksini bulur → biten eleme maçında yalnız son periyot animasyonla akar. */
function lastPeriodStart(log: string[]): number {
  for (let i = log.length - 1; i >= 0; i--) if (log[i].startsWith("▸")) return i;
  return 0;
}

/** Taktik seçim ızgarası (pul ilk maçı / eleme 1. periyot / devre arası). */
function TacticGrid({ locale }: { locale: Locale }) {
  return (
    <form action={playLiveMatchAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {TACTICS.map((tac) => (
        <button
          key={tac}
          name="tactic"
          value={tac}
          className="rounded-lg border border-black/15 p-3 text-left transition hover:border-emerald-500 hover:bg-emerald-500/10 dark:border-white/20"
        >
          <span className="text-sm font-medium">{t(locale, `tactic.${tac}`)}</span>
          <span className="mt-1 block text-xs opacity-70">{t(locale, `tacticDesc.${tac}`)}</span>
        </button>
      ))}
    </form>
  );
}

/** Tek "Devam/İlerle" butonu (server action). */
function AdvanceButton({ locale, labelKey }: { locale: Locale; labelKey: string }) {
  return (
    <form action={advanceLiveStageAction} className="mt-4">
      <button className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500">
        {t(locale, labelKey)}
      </button>
    </form>
  );
}

/** Sıradaki maçın taktik paneli (pul veya eleme). */
function PendingPanel({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const p = tour.pending;
  if (!p) return null;
  const label =
    p.phase === "POOL"
      ? `${p.round}${p.matchNo ? ` · ${t(locale, "canli.matchN", { n: p.matchNo })}` : ""}`
      : `${t(locale, "canli.eleme")} · ${p.round}`;
  return (
    <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
      <div className="text-sm opacity-70">
        {p.timeLabel} · {label}
      </div>
      <h2 className="mt-1 text-lg font-semibold">{t(locale, "canli.nextMatch", { opp: p.oppName })}</h2>
      <p className="mt-1 text-sm opacity-70">
        {p.phase === "DE" ? t(locale, "canli.tacticHintDE") : t(locale, "canli.tacticHintPool")}
      </p>
      <TacticGrid locale={locale} />
    </div>
  );
}

/** Tek maç kartı (pul veya eleme). `children` = animasyon bitince kartın DIŞINDA görünecek panel. */
function MatchCard({
  m,
  index,
  isPool,
  locale,
  auto,
  children,
}: {
  m: LiveTournamentDTO["played"][number];
  index: number;
  isPool?: boolean;
  locale: Locale;
  auto?: boolean;
  children?: ReactNode;
}) {
  const label = isPool
    ? `${m.round} · ${t(locale, "canli.matchN", { n: index + 1 })}`
    : `${t(locale, "canli.eleme")} · ${m.round}`;
  return (
    <div>
      <div className="mb-1 text-xs font-medium opacity-60">
        {m.timeLabel} · {label}
      </div>
      <CanliMac
        aName={m.aName}
        bName={m.bName}
        scoreA={m.scoreA}
        scoreB={m.scoreB}
        log={m.log}
        autoPlay={auto}
        past={!auto}
        instantThrough={!isPool ? lastPeriodStart(m.log) : 0}
        afterDone={children ?? undefined}
        locale={locale}
      />
    </div>
  );
}

export default async function CanliTurnuvaPage() {
  const tour = await getLiveTournament();
  if (!tour) redirect("/kariyer"); // aktif turnuva yok
  const locale = await getLocale();
  const stage = tour.stage;
  const ord = STAGE_ORDER[stage] ?? 0;

  const poolMatches = tour.played.filter((m) => m.phase === "POOL");
  const deMatches = tour.played.filter((m) => m.phase === "DE");

  const unlocked = {
    kagit: ord >= STAGE_ORDER.POOL_RESULT,
    maclar: true,
    klasman: ord >= STAGE_ORDER.STANDINGS,
    elemeler: ord >= STAGE_ORDER.KO_DRAW,
    sonuc: ord >= STAGE_ORDER.DONE,
  };
  const liveTab =
    ord <= STAGE_ORDER.WAIT_POOL
      ? "maclar"
      : ord === STAGE_ORDER.POOL_RESULT
        ? "kagit"
        : ord === STAGE_ORDER.STANDINGS
          ? "klasman"
          : ord <= STAGE_ORDER.WAIT_DE
            ? "elemeler"
            : "sonuc";

  const panels: Record<string, ReactNode> = {
    kagit: unlocked.kagit ? <KagitPanel tour={tour} locale={locale} live={stage === "POOL_RESULT"} /> : null,
    maclar: <MaclarPanel tour={tour} locale={locale} poolMatches={poolMatches} stage={stage} />,
    klasman: unlocked.klasman ? <Standings tour={tour} locale={locale} live={stage === "STANDINGS"} /> : null,
    elemeler: unlocked.elemeler ? <ElemelerPanel tour={tour} locale={locale} deMatches={deMatches} stage={stage} /> : null,
    sonuc: unlocked.sonuc ? <DoneScreen tour={tour} locale={locale} /> : null,
  };

  const tabs = [
    { id: "kagit", label: t(locale, "canli.tab.kagit"), locked: !unlocked.kagit },
    { id: "maclar", label: t(locale, "canli.tab.maclar"), locked: !unlocked.maclar },
    { id: "klasman", label: t(locale, "canli.tab.klasman"), locked: !unlocked.klasman },
    { id: "elemeler", label: t(locale, "canli.tab.elemeler"), locked: !unlocked.elemeler },
    { id: "sonuc", label: t(locale, "canli.tab.sonuc"), locked: !unlocked.sonuc },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{tour.name}</h1>
          <p className="text-sm opacity-70">
            {tour.categoryId} · {t(locale, `phase.${tour.phase}`)}
          </p>
        </div>
        {(stage === "POOL" || stage === "WAIT_POOL") && (
          <div className="rounded-lg border border-black/10 px-3 py-1.5 text-sm tabular-nums dark:border-white/15">
            {t(locale, "canli.poolCounter", { p: Math.min(tour.poolPlayed, tour.poolTotal), n: tour.poolTotal })}
          </div>
        )}
      </div>

      {/* Oyuncu durumu — turnuva boyunca güncel */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🔋 {t(locale, "profil.condition")}</div>
          <div className="font-semibold tabular-nums">%{tour.player.condition}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">🎯 {t(locale, "profil.form")}</div>
          <div className="font-semibold tabular-nums">%{tour.player.sharpness}</div>
        </div>
        <div className="rounded-lg border border-black/10 px-2 py-1.5 dark:border-white/15">
          <div className="text-xs opacity-60">⭐ {t(locale, "profil.overall")}</div>
          <div className="font-semibold tabular-nums">{tour.player.overall.toFixed(1)}</div>
        </div>
      </div>

      {/* Aşamalı sekmeler — aynı anda tek bölüm; sekmeler ilerledikçe açılır (spoiler yok) */}
      <TournamentTabs key={stage} tabs={tabs} defaultTab={liveTab} panels={panels} lockedMsg={t(locale, "canli.tabLocked")} />
    </main>
  );
}

/** "Pul maçları" sekmesi — kuralar / oynanan maçlar / bekleme (aşamaya göre). */
function MaclarPanel({
  tour,
  locale,
  poolMatches,
  stage,
}: {
  tour: LiveTournamentDTO;
  locale: Locale;
  poolMatches: LiveTournamentDTO["played"];
  stage: LiveTournamentDTO["stage"];
}) {
  if (stage === "POOL_INTRO") return <PoolIntro tour={tour} locale={locale} />;

  if (stage === "WAIT_POOL" && poolMatches.length > 0) {
    return (
      <section>
        <h2 className="text-lg font-semibold">{t(locale, "canli.poolMatches")}</h2>
        <div className="mt-3">
          <MatchCard m={poolMatches[poolMatches.length - 1]} index={poolMatches.length - 1} isPool locale={locale} auto>
            <Countdown seconds={WAIT_SECONDS} action={advanceLiveStageAction} label={t(locale, "canli.waitPool")} />
          </MatchCard>
        </div>
      </section>
    );
  }

  // POOL aşaması: maçlar teker teker. Pul bitti (browse): yalnız geçmiş maçlar.
  const playing = stage === "POOL";
  const gateNext = playing && tour.freshMatch && !tour.liveMatch && poolMatches.length > 0;
  const pending = playing && tour.pending ? <PendingPanel tour={tour} locale={locale} /> : null;

  return (
    <>
      {poolMatches.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">{t(locale, "canli.poolMatches")}</h2>
          <div className="mt-3 space-y-3">
            {poolMatches.map((m, i) => {
              const isLast = i === poolMatches.length - 1;
              return (
                <MatchCard key={i} m={m} index={i} isPool locale={locale} auto={isLast && gateNext}>
                  {isLast && gateNext ? pending : undefined}
                </MatchCard>
              );
            })}
          </div>
        </section>
      )}

      {playing && !gateNext && pending && <div className="mt-6">{pending}</div>}

      {playing && !tour.poolAwaitingResult && tour.upcoming.length > 0 && (
        <section className="mt-4">
          <h3 className="text-sm font-semibold opacity-70">{t(locale, "canli.upcomingLocked")}</h3>
          <ul className="mt-2 space-y-1">
            {tour.upcoming.map((u, i) => (
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
    </>
  );
}

/** "Pul kağıdı" sekmesi — poule sheet(ler). live: pul sonucu adımıysa "Devam". */
function KagitPanel({ tour, locale, live }: { tour: LiveTournamentDTO; locale: Locale; live: boolean }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{t(locale, "canli.poolSheets")}</h2>
      <p className="mt-1 text-xs opacity-60">{t(locale, "canli.poolSheetsNote")}</p>
      <div className="mt-3 space-y-5">
        {tour.poolSheets?.map((sheet) => (
          <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
        ))}
      </div>
      {live && <AdvanceButton locale={locale} labelKey="canli.continue" />}
    </section>
  );
}

/** Pul kuraları — havuz + rakipler (maçlar başlamadan). */
function PoolIntro({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const intro = tour.poolIntro;
  return (
    <section className="rounded-xl border border-sky-500/40 bg-sky-500/10 p-4">
      <h2 className="text-lg font-semibold">{t(locale, "canli.poolIntroTitle")}</h2>
      <p className="mt-1 text-sm opacity-80">{t(locale, "canli.poolIntroHint")}</p>
      {intro && (
        <>
          <div className="mt-3 text-sm font-medium opacity-70">{t(locale, "round.pool", { n: intro.poolNumber })}</div>
          <ul className="mt-2 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
            {intro.members.map((mem, i) => (
              <li key={i} className={`px-3 py-2 text-sm ${mem.isHuman ? "bg-emerald-500/10 font-medium" : ""}`}>
                {mem.name}
                {mem.isHuman ? ` (${t(locale, "common.youShort")})` : ""}
              </li>
            ))}
          </ul>
        </>
      )}
      <AdvanceButton locale={locale} labelKey="canli.startPool" />
    </section>
  );
}

/** Turnuva klasmanı (pul sonrası seeding). live: klasman adımıysa "Devam". */
function Standings({ tour, locale, live }: { tour: LiveTournamentDTO; locale: Locale; live: boolean }) {
  return (
    <section>
      <h2 className="text-lg font-semibold">{t(locale, "canli.seedingTitle")}</h2>
      <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
        {tour.seeding?.map((s) => (
          <li key={s.seedRank} className={`flex items-center px-3 py-2 text-sm ${s.isHuman ? "bg-emerald-500/10 font-medium" : ""}`}>
            <span className="mr-2 w-6 tabular-nums opacity-50">{s.seedRank}.</span>
            <span>
              {s.name}
              {s.isHuman ? ` (${t(locale, "common.youShort")})` : ""}
            </span>
          </li>
        ))}
      </ol>
      {live && <AdvanceButton locale={locale} labelKey="canli.continue" />}
    </section>
  );
}

/** "Elemeler" sekmesi — geçmiş eleme maçların + o anki aksiyon (kura / maç / bekleme). */
function ElemelerPanel({
  tour,
  locale,
  deMatches,
  stage,
}: {
  tour: LiveTournamentDTO;
  locale: Locale;
  deMatches: LiveTournamentDTO["played"];
  stage: LiveTournamentDTO["stage"];
}) {
  const animateLast = stage === "WAIT_DE";
  const history = animateLast ? deMatches.slice(0, -1) : deMatches;

  return (
    <>
      {history.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">{t(locale, "canli.deMatches")}</h2>
          <div className="mt-3 space-y-3">
            {history.map((m, i) => (
              <MatchCard key={i} m={m} index={i} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {stage === "KO_DRAW" && <KoDraw tour={tour} locale={locale} />}

      {stage === "DE" &&
        (tour.liveMatch ? (
          <section className={history.length > 0 ? "mt-6" : ""}>
            <div className="mb-1 text-xs font-medium opacity-60">
              {t(locale, "canli.eleme")} ·{" "}
              {t(locale, "canli.periodEnded", { round: tour.liveMatch.round, n: tour.liveMatch.periodsPlayed })}
            </div>
            <CanliPeriyot
              key={tour.liveMatch.log.length}
              aName={t(locale, "common.youShort")}
              oppName={tour.liveMatch.oppName}
              scoreHuman={tour.liveMatch.scoreHuman}
              scoreOpp={tour.liveMatch.scoreOpp}
              log={tour.liveMatch.log}
              instantThrough={tour.liveMatch.prevLen}
              locale={locale}
              afterDone={
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
                  <h2 className="text-lg font-semibold">
                    {t(locale, "canli.break", {
                      n: tour.liveMatch.nextPeriod,
                      a: tour.liveMatch.scoreHuman,
                      b: tour.liveMatch.scoreOpp,
                    })}
                  </h2>
                  <p className="mt-1 text-sm opacity-70">{t(locale, "canli.breakHint", { n: tour.liveMatch.totalPeriods })}</p>
                  <TacticGrid locale={locale} />
                </div>
              }
            />
          </section>
        ) : (
          <div className={history.length > 0 ? "mt-6" : ""}>
            <PendingPanel tour={tour} locale={locale} />
          </div>
        ))}

      {stage === "WAIT_DE" && deMatches.length > 0 && (
        <section className={history.length > 0 ? "mt-6" : ""}>
          <MatchCard m={deMatches[deMatches.length - 1]} index={deMatches.length - 1} locale={locale} auto>
            <Countdown seconds={WAIT_SECONDS} action={advanceLiveStageAction} label={t(locale, "canli.waitDe")} />
          </MatchCard>
        </section>
      )}
    </>
  );
}

/** Eleme kurası — o turun eşleşmeleri (skor yok) + elemeye/maça geç. */
function KoDraw({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const firstRound = tour.phase === "POOL_DONE";
  return (
    <section>
      <h2 className="text-lg font-semibold">{t(locale, "canli.koDrawTitle", { round: tour.roundName ?? "" })}</h2>
      <p className="mt-1 text-xs opacity-60">{t(locale, "canli.drawNote")}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tour.roundDraw?.map((d, i) => {
          const mine = d.aIsHuman || d.bIsHuman;
          return (
            <div
              key={i}
              className={`rounded-lg border p-2 text-xs ${
                mine ? "border-emerald-500/50 bg-emerald-500/10" : "border-black/10 dark:border-white/15"
              }`}
            >
              <div className={`truncate ${d.aIsHuman ? "font-semibold" : ""}`}>{d.aName}</div>
              <div className="my-0.5 text-center opacity-40">vs</div>
              <div className={`truncate ${d.bIsHuman ? "font-semibold" : ""}`}>{d.bName}</div>
            </div>
          );
        })}
      </div>

      {tour.seedRank != null && firstRound && (
        <p className="mt-3 text-sm opacity-80">{t(locale, "canli.seedInfo", { n: tour.seedRank })}</p>
      )}

      <AdvanceButton locale={locale} labelKey={firstRound ? "canli.enterBracket" : "canli.toMatch"} />
    </section>
  );
}

/** Turnuva bitiş ekranı — sonuç + klasman + eve dön. */
function DoneScreen({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  return (
    <div>
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
        <div className="text-sm opacity-70">{t(locale, "canli.doneTitle")}</div>
        <div className="mt-1 text-3xl font-bold">{positionLabel(locale, tour.finalPosition)}</div>
        <div className="mt-1 text-sm opacity-70">{t(locale, "canli.champion", { name: tour.championName ?? "?" })}</div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "canli.earned")}</div>
          <div className="font-semibold text-emerald-600">
            {tour.earnedPoints != null && tour.earnedPoints > 0 ? `+${tour.earnedPoints}` : "0"}
          </div>
        </div>
        <div className="rounded-lg border border-black/10 px-3 py-2 text-center dark:border-white/15">
          <div className="text-xs opacity-60">{t(locale, "canli.rankPlace")}</div>
          <div className="font-semibold">{tour.newRank != null ? `#${tour.newRank}` : "—"}</div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs opacity-50">{t(locale, "canli.quarterNote")}</p>

      {tour.standings && (
        <ol className="mt-4 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
          {tour.standings.slice(0, 8).map((s, i) => (
            <li key={i} className={`flex items-center justify-between px-3 py-2 text-sm ${s.isHuman ? "bg-emerald-500/10 font-medium" : ""}`}>
              <span>
                {s.name}
                {s.isHuman ? ` ${t(locale, "common.you")}` : ""}
              </span>
              <span className="opacity-70">{positionLabel(locale, s.position)}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <form action={leaveLiveTournamentAction}>
          <button className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500">
            {t(locale, "canli.home")}
          </button>
        </form>
        {tour.finalTournamentId != null && (
          <Link
            href={`/turnuva/${tour.finalTournamentId}`}
            className="rounded-lg border border-black/15 px-4 py-3 text-sm opacity-70 transition hover:opacity-100 dark:border-white/20"
          >
            {t(locale, "canli.seeTable")}
          </Link>
        )}
      </div>
    </div>
  );
}
