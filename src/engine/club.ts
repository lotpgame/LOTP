/**
 * Club Engine — tesis (facility) büyüme modeli (kullanıcı kararı 06.11).
 *
 * Tesis, kulübün antrenman kalitesidir (0–100). Kuruluş tabanından başlar ve o kulüpteki GERÇEK oyuncuların
 * sayısı + başarı ORANINA göre büyür/düşer. **Botlar hiç sayılmaz** (ne üye ne mezun).
 *
 * Neden başarı oranı? Düz "üye başına +puan" olsaydı, kalabalık ama başarısız bir kulüp (20 kişi, 5 başarılı)
 * küçük ama elit bir kulüpten (5 kişi, 5 başarılı) yüksek çıkardı — yanlış. Oranla çarpınca yeni açılan
 * başarısız hesaplar akın edince tesis DÜŞER; çocuklar derece yaptıkça oran yükselir, tesis geri çıkar.
 *
 * Saf fonksiyon: I/O yok. "Başarılı mezun" eşiği (önem ≥ 3 = madalya/şampiyonluk/ranking) sunucuda sayılır;
 * bu fonksiyon yalnız sayıları alır.
 */
import { clamp } from "./domain";

export const BASE_FACILITY = 30; // kuruluş tabanı (kullanıcı: "taban 30'dan başlasın")
export const MEMBER_WEIGHT = 1.5; // her gerçek üye
export const GRADUATE_WEIGHT = 4; // her başarılı mezun
export const MAX_FACILITY = 100;

/**
 * Tesis = taban + (üye×1.5 + mezun×4) × başarı_oranı, [taban, 100] arasına sıkıştırılır.
 * members: kulüpteki gerçek (bot olmayan) aktif oyuncu sayısı. graduates: bunlardan en az bir önemli başarısı
 * olanlar (graduates ≤ members). members=0 → taban (üye yoksa büyüme yok).
 */
export function computeFacility(baseFacility: number, members: number, graduates: number): number {
  if (members <= 0) return baseFacility;
  const grads = Math.min(graduates, members); // güvenlik: mezun üyeyi aşamaz
  const rate = grads / members; // başarı oranı 0..1
  const bonus = (members * MEMBER_WEIGHT + grads * GRADUATE_WEIGHT) * rate;
  return clamp(Math.round(baseFacility + bonus), baseFacility, MAX_FACILITY);
}

/* ─────────────────────────── Antrenör kalitesi (kullanıcı kararı 06.11) ───────────────────────────
 * Antrenör de 30'dan başlar ve yeteneği tesis kalitesini TAKİP eder — ama sürekli kayarak değil, OLAY olarak:
 * tesis, son antrenör gelişinden bu yana %20 artıp 1 hafta o seviyede sabit kaldığında eski antrenörler ayrılır,
 * yeni (daha yetenekli) antrenörler gelir (yeni isim, yetenek = güncel tesis; uzmanlıklar aynı kalır).
 * Böylece büyüyen kulüp daha iyi hoca çeker; küçük/yeni kulüpte mütevazı hocalar. */
export const BASE_COACH_SKILL = 30;
export const COACH_UPGRADE_RATIO = 1.2; // tetik: tesis son antrenör gelişine göre +%20
export const COACH_STABLE_DAYS = 7; // bu artış 1 hafta (7 oyun günü) sabit kalmalı

/** Antrenör yeteneği = tesis (1:1), [30, 100] (kullanıcı kararı). */
export function coachSkillForFacility(facility: number): number {
  return clamp(Math.round(facility), BASE_COACH_SKILL, MAX_FACILITY);
}

export interface CoachState {
  facility: number; // kulübün güncel tesisi
  lastCoachFacility: number; // antrenörlerin en son geldiği andaki tesis (eşik buna göre)
  pendingSinceDay: number; // +%20 eşiğinin ilk aşıldığı oyun günü (-1 = beklemede değil)
  currentDay: number; // güncel oyun günü (global)
}
export interface CoachDecision {
  upgrade: boolean; // true → antrenörler yenilensin
  newCoachSkill: number; // upgrade ise yeni yetenek (= güncel tesis)
  lastCoachFacility: number; // kalıcılaştırılacak yeni değer
  pendingSinceDay: number; // kalıcılaştırılacak yeni değer
}

/**
 * Antrenör yükseltme kararı (saf). Tesis eşiğin (son antrenör tesisi ×1.2) altındaysa bekleme sıfırlanır;
 * eşiğe ilk ulaşınca bekleme başlar; eşikte 1 hafta kalınca yükseltilir (yeni yetenek = güncel tesis).
 */
export function decideCoachUpgrade(s: CoachState): CoachDecision {
  const threshold = s.lastCoachFacility * COACH_UPGRADE_RATIO;
  const noChange = (pending: number, last: number): CoachDecision => ({
    upgrade: false,
    newCoachSkill: 0,
    lastCoachFacility: last,
    pendingSinceDay: pending,
  });
  if (s.facility < threshold) return noChange(-1, s.lastCoachFacility); // stabilite bozuldu → beklemeyi sıfırla
  if (s.pendingSinceDay < 0) return noChange(s.currentDay, s.lastCoachFacility); // eşiğe ilk ulaşıldı → bekleme başlat
  if (s.currentDay - s.pendingSinceDay >= COACH_STABLE_DAYS) {
    return { upgrade: true, newCoachSkill: coachSkillForFacility(s.facility), lastCoachFacility: s.facility, pendingSinceDay: -1 };
  }
  return noChange(s.pendingSinceDay, s.lastCoachFacility); // hâlâ bekliyor
}
