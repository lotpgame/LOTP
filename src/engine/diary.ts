/**
 * Kariyer Günlüğü (diary) — çocuğun başına gelenlerin TARİHLİ kaydı. Antrenman özetleri + psikoloji/malzeme
 * olayları burada kalıcı tutulur (kullanıcı 22.11). Turnuvalar (TournamentParticipant) ve para olayları
 * (ledger) ayrı kaynaklardan gelir; görüntüde hepsi güne göre birleşir. SAF modül: I/O yok. Kalıcılık
 * GameState.diary (JSON). Rapor (lastReport) GEÇİCİdir, üstüne yazılır; günlük KALICIdır → "geçmişte ne oldu".
 */

export interface DiaryTrain {
  day: number; // antrenmanın işlendiği oyun-günü
  kind: "train";
  session?: string; // o günün seans tipi (TECHNICAL/PHYSICAL/MENTAL/TACTICAL) — gün-gün log (yeni)
  gains?: { key: string; delta: number }[]; // ESKİ (per-advance özet) — geriye uyumluluk
  cond?: number;
}

export interface DiaryEvent {
  day: number; // olayın ait olduğu oyun-günü
  kind: "event";
  key: string; // i18n: event.<key> (psikoloji ya da malzeme: badDay, pocketMoney, weaponBroke…)
  denar?: number; // harçlık/hediye ise tutarı (+Denar) — günlükte "babadan harçlık +8" gibi gösterilir
}

export type DiaryEntry = DiaryTrain | DiaryEvent;

/** Saklanan en çok kayıt (eskiler budanır — alan şişmesin). Gün-gün log → sık kayıt; 240 ≈ son ~8 ay. */
export const DIARY_MAX = 240;

export function parseDiary(json: string | null | undefined): DiaryEntry[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (e): e is DiaryEntry =>
        !!e && typeof (e as DiaryEntry).day === "number" && ((e as DiaryEntry).kind === "train" || (e as DiaryEntry).kind === "event"),
    );
  } catch {
    return [];
  }
}

export function encodeDiary(entries: readonly DiaryEntry[]): string {
  return JSON.stringify(entries);
}

/** Yeni kayıtları ekler; en fazla DIARY_MAX tutar (baştan budar). */
export function appendDiary(prev: readonly DiaryEntry[], add: readonly DiaryEntry[]): DiaryEntry[] {
  const next = [...prev, ...add];
  return next.length > DIARY_MAX ? next.slice(next.length - DIARY_MAX) : next;
}
