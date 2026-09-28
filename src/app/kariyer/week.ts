/**
 * 7 günlük hafta şeridi verisi — bugünden itibaren 7 gün. YALNIZ mevcut veriden: sabit haftalık program
 * (engine), yaklaşan turnuvalar + kayıt durumu (sunucu DTO'su) ve oyuncunun haftalık antrenman planı.
 * Yaklaşan listede olmayan program günü (ara hafta Cumartesi, yaşa kapalı uluslararası Pazar) antrenman sayılır.
 * Şerit, başlıktaki "bugün" (kariyer günü) ile başlar → "Bugün" kartı ve alt çubukla hep aynı gün. Kariyer günü
 * dünya gününün gerisindeyse (örn. dünkü turnuva hâlâ "Katıl/Geç" bekliyor) aradaki günlerin kaydı kapanmıştır ve
 * yaklaşan listede yoktur → programdan okunur (yalnız yurt içi turnuva; uluslararası yaş kuralı sunucuda, burada
 * tekrar edilmez).
 */
import { activityForDay, dayOfWeek } from "@/engine/season";
import { t, type Locale } from "@/i18n";

const DOMESTIC = new Set(["IL", "TURKIYE", "OPEN"]);

export interface WeekDay {
  worldDay: number;
  dow: number; // 0 = Pazartesi … 6 = Pazar
  today: boolean;
  kind: "TOURNAMENT" | "TRAINING";
  level?: string;
  label?: string;
  registered?: boolean; // yalnız gelecek günler (bugünün kaydı kapanmıştır)
  qualified?: boolean;
  training?: string; // plan seansı (TECHNICAL … REST)
}

/** Başlık DTO'sundan bugünün bilgisi + kariyer gününün haftanın günü (gün adı aynı t() ile üretildiği için eşleşir). */
export function todayFromHeader(
  h: { dayName: string; today: { kind: "TRAINING" | "TOURNAMENT"; level?: string; label?: string; qualified?: boolean } } | null,
  locale: Locale,
) {
  if (!h) return null;
  const dow = [0, 1, 2, 3, 4, 5, 6].find((i) => t(locale, `day.${i}`) === h.dayName) ?? -1;
  return { ...h.today, dow };
}

export function buildWeek(
  worldToday: number,
  plan: readonly string[],
  upcoming: readonly { worldDay: number; level: string; label: string; registered: boolean; qualified: boolean }[],
  todayInfo: { dow: number; kind: "TRAINING" | "TOURNAMENT"; level?: string; label?: string; qualified?: boolean } | null,
): WeekDay[] {
  const byDay = new Map(upcoming.map((u) => [u.worldDay, u]));
  // Kariyer günü = dünya gününden geriye, başlıktaki haftanın gününe ilk denk gelen gün (en fazla 6 gün geri).
  const lag = todayInfo && todayInfo.dow >= 0 ? (dayOfWeek(worldToday) - todayInfo.dow + 7) % 7 : 0;
  const start = worldToday - lag;
  return Array.from({ length: 7 }, (_, i) => {
    const d = start + i;
    const dow = dayOfWeek(d);
    const training = plan[dow] ?? "REST";
    if (i === 0 && todayInfo?.kind === "TOURNAMENT" && todayInfo.dow === dow) {
      return { worldDay: d, dow, today: true, kind: "TOURNAMENT", level: todayInfo.level, label: todayInfo.label, qualified: todayInfo.qualified };
    }
    if (i > 0 && d <= worldToday) {
      const act = activityForDay(d);
      if (act.kind === "TOURNAMENT" && DOMESTIC.has(act.level)) return { worldDay: d, dow, today: false, kind: "TOURNAMENT", level: act.level };
    }
    const u = byDay.get(d);
    if (i > 0 && u) {
      return { worldDay: d, dow, today: false, kind: "TOURNAMENT", level: u.level, label: u.label, registered: u.registered, qualified: u.qualified };
    }
    return { worldDay: d, dow, today: i === 0, kind: "TRAINING", training };
  });
}
