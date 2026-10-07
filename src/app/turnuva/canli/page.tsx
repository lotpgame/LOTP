import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { advanceLiveStageAction, leaveLiveTournamentAction, playLiveMatchAction } from "@/app/actions";
import { TACTICS } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getLiveTournament, type LiveTournamentDTO } from "@/server/careerService";
import { CanliMac } from "../[id]/CanliMac";
import { PulKagidi } from "../[id]/PulKagidi";
import { Icon, type IconName } from "@/app/ui/Icon";
import { HeadlineCard, whatsAppHref } from "@/app/ui/HeadlineCard";
import { buildHeadline, lastBoutFrom } from "@/app/ui/headlineText";
import { CanliPeriyot } from "./CanliPeriyot";
import { SideScore } from "./matchParts";
import { Countdown } from "./Countdown";
import { TournamentTabs } from "./TournamentTabs";

// Canlı turnuva: her istekte taze (DB durumuna bağlı).
export const dynamic = "force-dynamic";

const WAIT_SECONDS = 10; // maç bitince sonraki aşamadan önce sabit bekleme (kullanıcı tercihi)

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

const TACTIC_ICON: Record<string, IconName> = { OFFENSIVE: "attack", BALANCED: "balanced", DEFENSIVE: "defence" };

/** Taktik seçim ızgarası (pul ilk maçı / eleme 1. periyot / devre arası). */
function TacticGrid({ locale }: { locale: Locale }) {
  return (
    <form action={playLiveMatchAction} className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
      {TACTICS.map((tac) => (
        <button
          key={tac}
          name="tactic"
          value={tac}
          className="press flex min-h-14 items-start gap-3 rounded-md border border-line bg-arena-0 p-3 text-left active:border-ink sm:flex-col sm:gap-1.5"
        >
          <Icon name={TACTIC_ICON[tac] ?? "balanced"} size={22} className="mt-0.5 shrink-0" />
          <span>
            <span className="font-display text-[18px] font-bold uppercase leading-none">{t(locale, `tactic.${tac}`)}</span>
            <span className="mt-1 block text-[13px] text-steel">{t(locale, `tacticDesc.${tac}`)}</span>
          </span>
        </button>
      ))}
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
    <div className="panel border-ink p-4">
      <div className="kicker">
        {p.timeLabel} · {label}
      </div>
      <h2 className="mt-1.5 font-display text-[22px] font-bold leading-tight">{t(locale, "canli.nextMatch", { opp: p.oppName })}</h2>
      <p className="mt-1 text-[14px] text-steel">
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
      <div className="kicker mb-1.5">
        {m.timeLabel} · {label}
      </div>
      <CanliMac
        youSide="left"
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
    kagit: poolMatches.length > 0 || ord >= STAGE_ORDER.POOL_RESULT, // ilk maçtan sonra pul kağıdı açık
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

  // Manuel ilerleme butonu (üstte): sadece bekleme gerektirmeyen adımlarda.
  const advanceKey =
    stage === "POOL_INTRO"
      ? "canli.startPool"
      : stage === "POOL_RESULT" || stage === "STANDINGS"
        ? "canli.continue"
        : stage === "KO_DRAW"
          ? tour.phase === "POOL_DONE"
            ? "canli.enterBracket"
            : "canli.toMatch"
          : null;

  const panels: Record<string, ReactNode> = {
    kagit: unlocked.kagit ? <KagitPanel tour={tour} locale={locale} /> : null,
    maclar: <MaclarPanel tour={tour} locale={locale} poolMatches={poolMatches} stage={stage} />,
    klasman: unlocked.klasman ? <Standings tour={tour} locale={locale} /> : null,
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
          <h1 className="font-display text-[26px] font-bold leading-tight">{tour.name}</h1>
          <p className="text-[13px] text-steel">
            {tour.categoryId} · {t(locale, `phase.${tour.phase}`)}
          </p>
        </div>
        {(stage === "POOL" || stage === "WAIT_POOL") && (
          <div className="num rounded-md border border-line bg-arena-1 px-3 py-1.5 text-[14px]">
            {t(locale, "canli.poolCounter", { p: Math.min(tour.poolPlayed, tour.poolTotal), n: tour.poolTotal })}
          </div>
        )}
      </div>

      {/* Oyuncu durumu — turnuva boyunca güncel */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat icon="condition" label={t(locale, "profil.condition")} value={`%${tour.player.condition}`} />
        <MiniStat icon="form" label={t(locale, "profil.form")} value={`%${tour.player.sharpness}`} />
        <MiniStat icon="rating" label={t(locale, "profil.overall")} value={tour.player.overall.toFixed(1)} />
      </div>

      {/* #25: aşama geçişleri OTOMATİK — manuel "geç/devam" butonu yok. Kısa bekleme sonra sistem ilerler;
          kullanıcı yalnız maç aralarında taktik seçer. Aşamaları sekmelerden geri inceleyebilir. */}
      {advanceKey && (
        <div className="mt-3">
          <Countdown
            seconds={stage === "KO_DRAW" ? 7 : stage === "POOL_INTRO" ? 6 : 5}
            action={advanceLiveStageAction}
            label={t(
              locale,
              stage === "POOL_INTRO"
                ? "canli.autoPool"
                : stage === "KO_DRAW"
                  ? "canli.autoBracket"
                  : "canli.autoContinue",
            )}
          />
        </div>
      )}

      {/* Aşamalı sekmeler — aynı anda tek bölüm; sekmeler ilerledikçe açılır (spoiler yok) */}
      <TournamentTabs key={stage} tabs={tabs} defaultTab={liveTab} panels={panels} lockedMsg={t(locale, "canli.tabLocked")} />
    </main>
  );
}

function MiniStat({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <div className="panel px-2.5 py-2">
      <div className="flex items-center gap-1 text-[12px] text-steel">
        <Icon name={icon} size={14} /> {label}
      </div>
      <div className="num mt-0.5 text-[17px]">{value}</div>
    </div>
  );
}

/** Sabit pul maçları listesi satırı (oynandı / sıradaki / kilitli). */
function FixtureRow({ no, opp, right, tone, locale }: { no: number; opp: string; right?: string; tone: "current" | "locked"; locale: Locale }) {
  return (
    <div
      className={`flex min-h-12 items-center justify-between gap-2 rounded-md border px-3 text-[14px] ${
        tone === "current" ? "border-ink bg-arena-1" : "border-line text-steel"
      }`}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        {tone === "locked" && <Icon name="lock" size={14} className="shrink-0" />}
        <span className="shrink-0 text-steel">{t(locale, "canli.matchN", { n: no })} ·</span>
        <span className="truncate">{opp}</span>
      </span>
      {right && (
        <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium">
          <span className="lamp bg-ink anim-live h-2 w-2" aria-hidden="true" />
          {right}
        </span>
      )}
    </div>
  );
}

/** "Pul maçları" sekmesi — TÜM maçların sabit listesi + o anki maç (kuru pop-in yok). */
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

  const fixtures = tour.poolFixtures ?? [];
  const poolPlayed = tour.poolPlayed;
  const gateNext = stage === "POOL" && tour.freshMatch && !tour.liveMatch && poolMatches.length > 0;
  const freshIdx = stage === "WAIT_POOL" || gateNext ? poolMatches.length - 1 : -1; // canlı akan maç
  const pendingTactic = stage === "POOL" && tour.pending ? <PendingPanel tour={tour} locale={locale} /> : null;

  return (
    <section>
      <h2 className="kicker mb-1">{t(locale, "canli.poolMatches")}</h2>
      <div className="mt-3 space-y-3">
        {fixtures.map((f, i) => {
          const key = f.matchNo;
          // Canlı akan maç (yeni oynanan) — kart olarak animasyonla; bittiğinde altına panel/countdown.
          if (i === freshIdx) {
            const m = poolMatches[i];
            const after =
              stage === "WAIT_POOL" ? (
                <Countdown seconds={WAIT_SECONDS} action={advanceLiveStageAction} label={t(locale, "canli.waitPool")} />
              ) : gateNext ? (
                pendingTactic
              ) : undefined;
            return <MatchCard key={key} m={m} index={i} isPool locale={locale} auto>{after}</MatchCard>;
          }
          // Oynanmış maç — katlanır skor + tekrar izleme.
          if (f.done) {
            const m = poolMatches[i];
            return (
              <details key={key} className="panel group">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 text-[14px] [&::-webkit-details-marker]:hidden">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon name={f.scoreHuman > f.scoreOpp ? "check" : "close"} size={15} className="shrink-0 text-steel" />
                    <span className="shrink-0 text-steel">{t(locale, "canli.matchN", { n: f.matchNo })} ·</span>
                    <span className="truncate">{f.oppName}</span>
                  </span>
                  {/* Sen soldasın (kırmızı), rakip sağda (yeşil) — renk kazananı söylemez, ikon söyler */}
                  <SideScore a={f.scoreHuman} b={f.scoreOpp} />
                </summary>
                {m && (
                  <div className="border-t border-line p-2">
                    <CanliMac aName={m.aName} bName={m.bName} scoreA={m.scoreA} scoreB={m.scoreB} log={m.log} past locale={locale} />
                  </div>
                )}
              </details>
            );
          }
          // Sıradaki maç — kapı açıksa (canlı akan maç var) yalnız işaret; değilse taktik paneli.
          if (i === poolPlayed && stage === "POOL") {
            if (gateNext) return <FixtureRow key={key} no={f.matchNo} opp={f.oppName} right={t(locale, "canli.nextUp")} tone="current" locale={locale} />;
            return <div key={key}>{pendingTactic}</div>;
          }
          // Gelecek maçlar — kilitli (sabit, her zaman görünür).
          return <FixtureRow key={key} no={f.matchNo} opp={f.oppName} tone="locked" locale={locale} />;
        })}
      </div>
    </section>
  );
}

/** "Pul kağıdı" sekmesi — önce SENİN pulun; diğer puller katlanır (pul bitince). */
function KagitPanel({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const sheets = tour.poolSheets ?? [];
  const mine = sheets.find((s) => s.poolNumber === tour.humanPoolNumber);
  const others = sheets.filter((s) => s.poolNumber !== tour.humanPoolNumber);
  return (
    <section>
      <h2 className="kicker mb-1">{t(locale, "canli.poolSheets")}</h2>
      <p className="mt-1 text-[13px] text-steel">{t(locale, "canli.poolSheetsNote")}</p>
      {mine && (
        <div className="mt-3">
          <PulKagidi sheet={mine} locale={locale} />
        </div>
      )}
      {tour.phase !== "POOL" && others.length > 0 && (
        <details className="panel group mt-4">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-3 text-[14px] [&::-webkit-details-marker]:hidden">
            {t(locale, "canli.otherPools")}
            <Icon name="chevron-down" size={16} className="text-steel transition-transform group-open:rotate-180" />
          </summary>
          <div className="space-y-5 px-3 pb-3">
            {others.map((sheet) => (
              <PulKagidi key={sheet.poolNumber} sheet={sheet} locale={locale} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}

/** Pul kuraları — havuz + rakipler (maçlar başlamadan). */
function PoolIntro({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const intro = tour.poolIntro;
  return (
    <section className="panel p-4">
      <h2 className="kicker mb-1">{t(locale, "canli.poolIntroTitle")}</h2>
      <p className="mt-1 text-[14px] text-steel">{t(locale, "canli.poolIntroHint")}</p>
      {intro && (
        <>
          <div className="mt-3 font-display text-[17px] font-bold uppercase">{t(locale, "round.pool", { n: intro.poolNumber })}</div>
          <ul className="mt-2 overflow-hidden rounded-md border border-line">
            {intro.members.map((mem, i) => (
              <li
                key={i}
                className={`relative flex min-h-11 items-center gap-2 border-b border-line px-3 text-[14px] last:border-b-0 ${mem.isHuman ? "bg-arena-2 font-semibold" : ""}`}
              >
                {mem.isHuman && <span className="absolute inset-y-0 left-0 w-[3px] bg-me" aria-hidden="true" />}
                <span className="num w-5 text-steel">{i + 1}</span>
                {mem.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

/** Turnuva klasmanı (pul sonrası) — gerçek pul klasmanı gibi G-M / averaj / tuş. */
function Standings({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  return (
    <section>
      <h2 className="kicker mb-1">{t(locale, "canli.seedingTitle")}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="kicker">
              <th className="py-1 pr-2 text-left font-medium">#</th>
              <th className="py-1 pr-2 text-left font-medium">{t(locale, "klasman.player")}</th>
              <th className="py-1 px-2 text-center font-medium">{t(locale, "klasman.winLoss")}</th>
              <th className="py-1 px-2 text-center font-medium">{t(locale, "klasman.avg")}</th>
              <th className="py-1 pl-2 text-right font-medium">{t(locale, "klasman.touches")}</th>
            </tr>
          </thead>
          <tbody>
            {tour.seeding?.map((s) => (
              <tr key={s.seedRank} className={`border-t border-line ${s.isHuman ? "bg-arena-2 font-semibold" : ""}`}>
                <td className={`num py-2 pr-2 pl-1 ${s.isHuman ? "border-l-[3px] border-me" : ""}`}>{s.seedRank}</td>
                <td className="py-2 pr-2">{s.name}</td>
                <td className="num py-2 px-2 text-center">
                  {s.wins}-{s.matches - s.wins}
                </td>
                <td className="num py-2 px-2 text-center">
                  {s.indicator > 0 ? `+${s.indicator}` : s.indicator}
                </td>
                <td className="num py-2 pl-2 text-right text-steel">{s.touchesScored}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
          <h2 className="kicker mb-1">{t(locale, "canli.deMatches")}</h2>
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
            <div className="kicker mb-1.5">
              {t(locale, "canli.eleme")} ·{" "}
              {t(locale, "canli.periodEnded", { round: tour.liveMatch.round, n: tour.liveMatch.periodsPlayed })}
            </div>
            <CanliPeriyot
              key={tour.liveMatch.log.length}
              aName={tour.playerName}
              oppName={tour.liveMatch.oppName}
              scoreHuman={tour.liveMatch.scoreHuman}
              scoreOpp={tour.liveMatch.scoreOpp}
              log={tour.liveMatch.log}
              instantThrough={tour.liveMatch.prevLen}
              locale={locale}
              afterDone={
                <div className="panel border-ink p-4">
                  <h2 className="font-display text-[20px] font-bold leading-tight">
                    {t(locale, "canli.break", {
                      n: tour.liveMatch.nextPeriod,
                      a: tour.liveMatch.scoreHuman,
                      b: tour.liveMatch.scoreOpp,
                    })}
                  </h2>
                  <p className="mt-1 text-[14px] text-steel">{t(locale, "canli.breakHint", { n: tour.liveMatch.totalPeriods })}</p>
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

/** Eleme kurası — o turun eşleşmeleri (skor yok). İlerleme butonu üstte. */
function KoDraw({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  return (
    <section>
      <h2 className="kicker mb-1">{t(locale, "canli.koDrawTitle", { round: tour.roundName ?? "" })}</h2>
      <p className="mt-1 text-[13px] text-steel">{t(locale, "canli.drawNote")}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {tour.roundDraw?.map((d, i) => {
          const mine = d.aIsHuman || d.bIsHuman;
          return (
            <div
              key={i}
              className={`rounded-md border px-3 py-2 text-[14px] ${mine ? "border-ink bg-arena-1" : "border-line"}`}
            >
              <div className={`truncate ${d.aIsHuman ? "font-semibold" : "text-steel"}`}>{d.aName}</div>
              <div className="kicker my-0.5 text-center">vs</div>
              <div className={`truncate ${d.bIsHuman ? "font-semibold" : "text-steel"}`}>{d.bName}</div>
            </div>
          );
        })}
      </div>
      {tour.seedRank != null && tour.phase === "POOL_DONE" && (
        <p className="mt-3 text-[14px] text-steel">{t(locale, "canli.seedInfo", { n: tour.seedRank })}</p>
      )}
    </section>
  );
}

/** Turnuva bitiş ekranı — sonuç + klasman + eve dön (tüm tablo butonu yok; sekmelerden gezilir). */
async function DoneScreen({ tour, locale }: { tour: LiveTournamentDTO; locale: Locale }) {
  const me = tour.seeding?.find((s) => s.isHuman);
  const headline = buildHeadline(locale, {
    name: tour.playerName,
    tournament: tour.name,
    position: tour.finalPosition ?? 0,
    fieldSize: tour.standings?.length,
    pool: me ? { wins: me.wins, losses: me.matches - me.wins, indicator: me.indicator } : null,
    lastBout: lastBoutFrom(tour.played),
  });
  return (
    <div>
      <HeadlineCard h={headline} kicker={t(locale, "canli.doneTitle")} shareHref={await whatsAppHref(locale, headline)} locale={locale}>
        {!headline.champion && tour.championName && (
          <p className="mt-1 text-[14px] text-steel">{t(locale, "canli.champion", { name: tour.championName })}</p>
        )}
      </HeadlineCard>

      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="panel px-3 py-2.5 text-center">
          <div className="text-[12px] text-steel">{t(locale, "canli.earned")}</div>
          {tour.givesRankingPoints ? (
            <div className="num mt-0.5 text-[20px]">{tour.earnedPoints != null && tour.earnedPoints > 0 ? `+${tour.earnedPoints}` : "0"}</div>
          ) : (
            <div className="mt-1 text-[13px] text-steel">{t(locale, "canli.openNoPoints")}</div>
          )}
        </div>
        <div className="panel px-3 py-2.5 text-center">
          <div className="text-[12px] text-steel">{t(locale, "canli.xp")}</div>
          <div className="num mt-0.5 text-[20px]">{tour.earnedXp != null && tour.earnedXp > 0 ? `+${tour.earnedXp}` : "0"}</div>
        </div>
        <div className="panel px-3 py-2.5 text-center">
          <div className="text-[12px] text-steel">{t(locale, "canli.rankPlace")}</div>
          <div className="num mt-0.5 text-[20px]">{tour.newRank != null ? `#${tour.newRank}` : "—"}</div>
        </div>
      </div>
      <p className="mt-1.5 text-center text-[13px] text-steel">{t(locale, "canli.quarterNote")}</p>

      {tour.standings && (
        <ol className="panel mt-4 overflow-hidden">
          {tour.standings.slice(0, 8).map((s, i) => (
            <li
              key={i}
              className={`relative flex min-h-11 items-center justify-between gap-2 border-b border-line px-3 text-[14px] last:border-b-0 ${s.isHuman ? "bg-arena-2 font-semibold" : ""}`}
            >
              {(s.isHuman || s.position === 1) && (
                <span className={`absolute inset-y-0 left-0 w-[3px] ${s.isHuman ? "bg-me" : "bg-prio"}`} aria-hidden="true" />
              )}
              <span className="truncate">{s.name}</span>
              <span className="shrink-0 text-steel">{positionLabel(locale, s.position)}</span>
            </li>
          ))}
        </ol>
      )}

      <form action={leaveLiveTournamentAction} className="mt-5">
        <button className="btn-ink press h-12 w-full text-[16px]">{t(locale, "canli.home")}</button>
      </form>
    </div>
  );
}
