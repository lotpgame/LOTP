"use client";

/**
 * Sıradaki turnuva göstergesi — gerçek saat + canlı geri sayım (TR).
 * `variant="card"`: Turnuvalar sayfasının üstündeki vurgulu kart.
 * `variant="bar"`: alt çubukta antrenman günlerinde tek satırlık ipucu.
 * Geri sayım yalnız istemcide (mount sonrası) hesaplanır → hydration uyumsuzluğu olmaz.
 */
import { useEffect, useState } from "react";

export interface NextTournamentInfo {
  level: string;
  label: string;
  dayName: string;
  startMs: number;
  daysUntil: number;
  isToday: boolean;
  qualified: boolean;
  requirement: string;
}

function hhmmTR(ms: number): string {
  return new Date(ms).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
}

/** TR takvim günü anahtarı (YYYY-MM-DD) — "Bugün/Yarın" kararı gerçek tarihe göre verilir. */
function dateKeyTR(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}

function weekdayTR(ms: number): string {
  return new Date(ms).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long" });
}

function fmtRemaining(ms: number): string {
  const totalMin = Math.floor(ms / 60000);
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d} gün ${h} saat`;
  if (h > 0) return `${h} saat ${m} dakika`;
  return `${m} dakika`;
}

export function NextTournament({ info, variant }: { info: NextTournamentInfo; variant: "card" | "bar" }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    // İlk değer mount'tan hemen sonra (senkron değil → hydration uyumsuzluğu ve cascade render yok).
    const first = setTimeout(() => setNow(Date.now()), 0);
    const id = setInterval(() => setNow(Date.now()), 30_000); // 30 sn'de bir tazele
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, []);

  const hhmm = hhmmTR(info.startMs);
  // Etiket gerçek TR takvimine göre: 19:00 geçişi yüzünden "sonraki oyun günü" çoğu zaman bu akşamdır.
  const dayLabel =
    now == null
      ? info.dayName // SSR / mount öncesi: nötr (oyun günü adı)
      : dateKeyTR(info.startMs) === dateKeyTR(now)
        ? "Bugün"
        : dateKeyTR(info.startMs) === dateKeyTR(now + 86_400_000)
          ? "Yarın"
          : weekdayTR(info.startMs);
  const openNow = now != null && now >= info.startMs;
  const remaining = now == null ? null : Math.max(0, info.startMs - now);

  if (variant === "bar") {
    return (
      <span className="mt-0.5 block truncate text-xs opacity-70">
        ⏰ Sıradaki: {info.label} · {dayLabel} {hhmm}
        {!openNow && remaining != null ? ` (${fmtRemaining(remaining)})` : ""}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3">
      <div className="text-xs font-medium opacity-70">⏳ Sıradaki turnuva</div>
      <div className="mt-0.5 text-base font-semibold">🏆 {info.label}</div>
      <div className="mt-1 text-sm">
        📅 {dayLabel} · ⏰ {hhmm} <span className="opacity-60">(TR)</span>
      </div>
      {openNow ? (
        <div className="mt-1 text-sm font-medium text-emerald-700 dark:text-emerald-300">
          🟢 Şu an açık — girip “Katıl” diyebilirsin!
        </div>
      ) : (
        remaining != null && <div className="mt-1 text-sm opacity-80">⌛ {fmtRemaining(remaining)} kaldı</div>
      )}
      {!info.qualified && <div className="mt-1 text-xs opacity-60">🔒 {info.requirement}</div>}
    </div>
  );
}
