"use client";

/**
 * Market'teki "Denar Kazan & Al" paneli (monetization, src/engine/ads.ts).
 *
 * TASARIM (kullanıcı kararı): reklam İSTENMEDEN açılmaz. Oyuncu burada isteyerek "Reklam İzle" der →
 * kısa bir "reklam oynatılıyor" simülasyonu (gerçek reklam ağı lansmanta buraya bağlanır) → +Denar
 * (günde en çok adDailyCap). Paketler gösterilir ama satın alma lansmanta (sahte ödeme YOK).
 */
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { watchAdAction } from "@/app/actions";
import type { DenarPackage } from "@/engine/ads";
import { DenarMark } from "../DenarMark";

const AD_SECONDS = 5; // simüle reklam süresi (gerçek ödüllü video lansmanta)

type Labels = {
  earnTitle: string;
  watch: string;
  left: string;
  playing: string;
  earned: string;
  capReached: string;
  buyTitle: string;
  best: string;
  soon: string;
  soonNote: string;
};

export function DenarPanel({
  adsLeft,
  adDailyCap,
  adReward,
  packages,
  labels,
}: {
  adsLeft: number;
  adDailyCap: number;
  adReward: number;
  packages: readonly DenarPackage[];
  labels: Labels;
}) {
  const [left, setLeft] = useState(adsLeft);
  const [syncedAt, setSyncedAt] = useState(adsLeft);
  const [count, setCount] = useState(0); // >0 → reklam oynuyor (geri sayım)
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sunucu tazelemesi yeni kalan hakkı getirirse senkron tut — effect yerine render-içi düzeltme (React önerisi).
  if (syncedAt !== adsLeft) {
    setSyncedAt(adsLeft);
    setLeft(adsLeft);
  }
  useEffect(() => () => void (timer.current && clearInterval(timer.current)), []);

  const playing = count > 0;
  const done = left <= 0 && !playing;

  const watch = useCallback(() => {
    if (playing || pending || left <= 0) return;
    setMsg(null);
    // Geri sayım closure değişkeniyle (state updater SAF kalır; yan etki updater dışında → Strict Mode güvenli).
    let remaining = AD_SECONDS;
    setCount(remaining);
    timer.current = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCount(remaining);
        return;
      }
      if (timer.current) clearInterval(timer.current);
      setCount(0);
      // Simülasyon bitti → sunucuda ödülü ver (gerçek reklam ağı lansmanta buraya girer).
      start(async () => {
        const r = await watchAdAction();
        if (r.ok) {
          setLeft(r.adsLeft);
          setMsg(labels.earned.replace("{n}", String(adReward)));
        } else {
          setMsg(labels.capReached);
        }
      });
    }, 1000);
  }, [playing, pending, left, adReward, labels]);

  return (
    <div className="grid gap-2.5 border-t border-line px-4 pb-4 pt-3 sm:grid-cols-2">
      {/* Reklam izle → +Denar */}
      <div className="panel flex flex-col gap-2 p-3">
        <div className="text-[15px] font-semibold">{labels.earnTitle}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-steel">
          <span className="flex items-center gap-1 rounded bg-sig-green/15 px-1.5 py-px text-[12px] font-semibold text-sig-green">
            +{adReward} <DenarMark size={12} />
          </span>
          <span>
            · {labels.left}: <span className="num">{left}/{adDailyCap}</span>
          </span>
        </div>
        <button
          onClick={watch}
          disabled={playing || pending || done}
          className={`press mt-1 flex min-h-11 items-center justify-center gap-2 text-[14px] font-semibold ${
            done ? "btn-ghost cursor-not-allowed text-steel" : "btn-ink"
          }`}
        >
          {playing ? `📺 ${labels.playing} ${count}` : `📺 ${labels.watch}`}
        </button>
        {msg && <div className="text-[13px] font-medium text-ink">{msg}</div>}
      </div>

      {/* Denar paketleri (lansmanta açılacak — satın alma yok) */}
      <div className="panel flex flex-col gap-2 p-3">
        <div className="text-[15px] font-semibold">{labels.buyTitle}</div>
        <ul className="grid grid-cols-2 gap-2">
          {packages.map((p) => (
            <li key={p.denar} className={`rounded-md border p-2 text-center ${p.best ? "border-ink" : "border-line"}`}>
              {p.best && <div className="kicker mb-0.5 text-[10px] text-sig-green">{labels.best}</div>}
              <div className="flex items-center justify-center gap-1 text-[15px] font-semibold">
                <DenarMark size={14} /> <span className="num">{p.denar}</span>
              </div>
              <div className="num text-[13px] text-steel">{p.gbp}</div>
              <span className="mt-1 inline-block rounded bg-arena-2 px-1.5 py-px text-[11px] text-steel">{labels.soon}</span>
            </li>
          ))}
        </ul>
        <div className="text-[12px] text-steel">{labels.soonNote}</div>
      </div>
    </div>
  );
}
