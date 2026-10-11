"use client";

/**
 * #51 PODYUM — canlı turnuvanın "olay anı". Tek blok, sunucu-zamanına göre iki mod arasında geçer:
 *  - OYNAMA (PLAY): o an oynanan maç/periyot senkron animasyonla akar (CanliMac), taktik KİLİTLİ.
 *  - HAZIRLIK (PREP): sıradaki maç/periyot için rakip + AKTİF taktik butonları + "başlamasına" geri sayımı.
 * Mod kararı `now`'ın (sunucuya hizalı) saf fonksiyonu: maçı üreten adımın çözüm anı `playStart`, animasyon
 * `animMs` sürer; `now < playStart+animMs` → OYNAMA, değilse → HAZIRLIK. Böylece biten maç podyumdan düşer
 * (geçmişe iner), sıradaki hazırlığa geçilir; taktik hep o an odaktaki maça aittir (NOTLAR #49/#51/#52).
 * Spoiler önlemi (#54): eleme maçı oynanırken "sıradaki rakip" satırı gizlenir (kazandığını ele vermesin).
 */
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { submitLiveTacticAction } from "@/app/actions";
import { TACTICS, type Tactic } from "@/engine/combat";
import { t, type Locale } from "@/i18n";
import { Icon, type IconName } from "@/app/ui/Icon";
import type { TournamentLiveDTO } from "@/server/careerService";
import { CanliMac } from "./CanliMac";

const TACTIC_ICON: Record<Tactic, IconName> = { OFFENSIVE: "attack", BALANCED: "balanced", DEFENSIVE: "defence" };

export interface PodiumMatch {
  aName: string;
  bName: string;
  scoreA: number;
  scoreB: number;
  log: string[];
  phase: "POOL" | "DE";
  round: string;
  aIsHuman: boolean;
  instantThrough: number; // elemede: önceki periyotları anında göster, yalnız o anki periyot animasyonla aksın
}

function fmtLeft(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LivePodium({
  tournamentId,
  live,
  podiumMatch,
  locale,
}: {
  tournamentId: number;
  live: TournamentLiveDTO;
  podiumMatch: PodiumMatch | null;
  locale: Locale;
}) {
  const router = useRouter();
  const serverNowMs = new Date(live.serverNow).getTime();
  const skew = useRef(0);
  useEffect(() => {
    skew.current = serverNowMs - Date.now();
  }, [serverNowMs]);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now() + skew.current);
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, []);
  const nowOr = now ?? serverNowMs; // ilk kare: sunucu "şimdi"si (render'da Date.now() yok → saf)

  // Geri sayım bitince bir kez tazele → sunucu sıradaki adımı çözer, podyum yeni maça/periyoda geçer.
  const nextAtMs = live.nextAt ? new Date(live.nextAt).getTime() : null;
  const refreshedFor = useRef<string | null>(null);
  useEffect(() => {
    if (now == null || nextAtMs == null || now < nextAtMs || refreshedFor.current === live.nextAt) return;
    refreshedFor.current = live.nextAt;
    router.refresh();
  }, [now, nextAtMs, live.nextAt, router]);

  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const send = (tactic: Tactic) => {
    setMsg(null);
    startTransition(async () => {
      const res = await submitLiveTacticAction(tournamentId, tactic);
      setMsg(
        res.ok
          ? { ok: true, text: t(locale, "live.tactic.sent", { tactic: t(locale, `tactic.${res.tactic}`) }) }
          : { ok: false, text: t(locale, `live.tactic.err.${res.reason}`) },
      );
      router.refresh();
    });
  };

  // — Mod kararı — : maçı üreten adımın çözüm anından animMs kadar OYNAMA, sonra HAZIRLIK.
  const playStart = live.podium ? new Date(live.podium.playStartAt).getTime() : null;
  const animMs = live.podium?.animMs ?? 0;
  const playEnd = playStart != null ? playStart + animMs : null;
  const isPlaying = podiumMatch != null && playEnd != null && nowOr < playEnd;

  const you = live.you;
  const closesAtMs = you?.windowClosesAt ? new Date(you.windowClosesAt).getTime() : null;
  const windowOpen = !!you?.windowOpen && (closesAtMs == null || nowOr < closesAtMs);
  const periodNo = you?.nextMatch?.periodNo ?? null;
  // NOT: "Canlı turnuva" + GMT saat rozeti artık başlık hizasında (LiveStatusBadge, page.tsx) — burada tekrarlanmaz.

  // ——— OYNAMA ———
  if (isPlaying && podiumMatch) {
    const isDe = podiumMatch.phase === "DE";
    // "Olay anı" yerine o an NE olduğunu yaz (kullanıcı kararı): pulda "Pul maçları devam ediyor",
    // elemede hangi tur + kaçıncı periyot oynanıyor (periyot sayısı = log'daki "▸" başlık adedi).
    const periodsShown = podiumMatch.log.filter((l) => l.startsWith("▸")).length;
    const statusLabel = isDe
      ? periodsShown > 0
        ? t(locale, "podium.dePlaying", { round: podiumMatch.round, p: periodsShown })
        : t(locale, "podium.deSingle", { round: podiumMatch.round })
      : t(locale, "podium.poolOngoing");
    // Spoiler önlemi: elemede "sıradaki rakip" satırı gizli; havuzda sıradaki pul rakibi (sürpriz değil) gösterilir.
    const nextName = !isDe && you?.nextMatch?.opponentName ? you.nextMatch.opponentName : null;
    return (
      <section className="flex flex-col gap-2">
        <div className="text-[13px] font-medium text-steel">{statusLabel}</div>
        <CanliMac
          aName={podiumMatch.aName}
          bName={podiumMatch.bName}
          scoreA={podiumMatch.scoreA}
          scoreB={podiumMatch.scoreB}
          log={podiumMatch.log}
          autoPlay
          instantThrough={podiumMatch.instantThrough}
          youSide={podiumMatch.aIsHuman ? "left" : "right"}
          locale={locale}
          serverNow={live.serverNow}
          playStartAt={live.podium?.playStartAt}
          animMs={animMs}
        />
        {nextName && (
          <p className="px-1 text-[13px] text-steel">{t(locale, "podium.nextUp", { name: nextName })}</p>
        )}
      </section>
    );
  }

  // ——— HAZIRLIK ———
  const startsIn =
    nextAtMs == null ? null : nowOr >= nextAtMs ? t(locale, "live.resolving") : fmtLeft(nextAtMs - nowOr);
  const prepTitle =
    periodNo != null && periodNo > 1 ? t(locale, "podium.periodStarts", { p: periodNo }) : t(locale, "podium.matchStarts");
  // Periyot arası: aynı maçın o ana dek skoru (devam eden eleme maçı).
  const showScoreSoFar = podiumMatch != null && podiumMatch.phase === "DE" && periodNo != null && periodNo > 1;

  return (
    <section className="panel border-ink p-4">
      {you?.eliminated ? (
        <p className="text-[14px]">{t(locale, "live.you.eliminated")}</p>
      ) : you?.nextMatch ? (
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <div className="kicker">{showScoreSoFar ? t(locale, "podium.break") : t(locale, "podium.prep")}</div>
            {startsIn && <div className="num text-[22px] leading-none" aria-live="polite">{startsIn}</div>}
          </div>
          {showScoreSoFar && podiumMatch ? (
            /* Devre arası: tur + o ana dek SKOR (adın–skor–rakip), altında "N. periyot başlıyor" (kullanıcı tasarımı). */
            <>
              <div className="mt-1 font-display text-[17px] font-semibold">{you.nextMatch.round}</div>
              <div className="mt-1.5 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <div className="min-w-0">
                  <div className={`truncate text-[15px] ${podiumMatch.aIsHuman ? "font-semibold text-me" : ""}`}>{podiumMatch.aName}</div>
                  {podiumMatch.aIsHuman && <span className="text-[11px] font-semibold text-me">{t(locale, "live.you")}</span>}
                </div>
                <div className="num text-[26px] font-bold leading-none">
                  {podiumMatch.scoreA}–{podiumMatch.scoreB}
                </div>
                <div className="min-w-0 text-right">
                  <div className={`truncate text-[15px] ${!podiumMatch.aIsHuman ? "font-semibold text-me" : ""}`}>{podiumMatch.bName}</div>
                  {!podiumMatch.aIsHuman && <span className="text-[11px] font-semibold text-me">{t(locale, "live.you")}</span>}
                </div>
              </div>
              <div className="mt-2 text-[14px] font-semibold">{prepTitle}</div>
            </>
          ) : (
            <>
              <div className="mt-1 text-[16px] font-semibold">{prepTitle}</div>
              <div className="mt-0.5 text-[15px]">
                <span className="text-steel">{you.nextMatch.round} · </span>
                {you.nextMatch.opponentName
                  ? t(locale, "live.you.vs", { name: you.nextMatch.opponentName })
                  : t(locale, "live.you.tbd")}
              </div>
            </>
          )}

          {you.nextMatch.isNextStep ? (
            <div className="mt-3">
              <div className="flex w-full rounded-md border border-line p-0.5" role="group">
                {TACTICS.map((tac) => {
                  const active = tac === you.effectiveTactic;
                  return (
                    <button
                      key={tac}
                      type="button"
                      onClick={() => send(tac)}
                      disabled={!windowOpen || pending}
                      aria-pressed={active}
                      className={`flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-[5px] text-[14px] transition-colors disabled:opacity-50 ${
                        active ? "bg-ink font-semibold text-arena-0" : "text-steel"
                      }`}
                    >
                      <Icon name={TACTIC_ICON[tac]} size={17} />
                      {t(locale, `tactic.${tac}`)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-[13px] text-steel">
                {windowOpen
                  ? t(locale, you.pendingSet ? "live.tactic.sent" : "live.tactic.fallback", {
                      tactic: t(locale, `tactic.${you.effectiveTactic}`),
                    })
                  : t(locale, "live.tactic.locked")}
              </p>
              {/* Başarı geri bildirimi zaten üstteki "gönderildi: X" durum satırında var → yalnız HATA ayrı gösterilir (tek sefer). */}
              {msg && !msg.ok && (
                <p className="mt-1 text-[13px] text-sig-red" role="status">
                  {msg.text}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[13px] text-steel">{t(locale, "live.you.bye", { round: you.nextMatch.round })}</p>
          )}
        </div>
      ) : (
        <p className="text-[14px] text-steel">
          {live.nextKind === "RESULTS" ? t(locale, "live.you.waitBracket") : t(locale, "live.you.none")}
        </p>
      )}
    </section>
  );
}

/** "Canlı turnuva" rozeti + canlı GMT saati — turnuva başlığının hizasında (page.tsx). */
export function LiveStatusBadge({ serverNow, locale }: { serverNow: string; locale: Locale }) {
  const skew = useRef(0);
  useEffect(() => {
    skew.current = new Date(serverNow).getTime() - Date.now();
  }, [serverNow]);
  const [nowMs, setNowMs] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMs(Date.now() + skew.current);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  const clock =
    nowMs == null
      ? null
      : new Date(nowMs).toLocaleTimeString(locale === "tr" ? "tr-TR" : locale, { timeZone: "UTC", hour: "2-digit", minute: "2-digit" });
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="lamp lamp-red anim-live h-2.5 w-2.5" aria-hidden="true" />
      <span className="font-display text-[13px] font-bold">{t(locale, "live.title")}</span>
      {clock && <span className="num text-[12px] text-steel">{clock} GMT</span>}
    </div>
  );
}
