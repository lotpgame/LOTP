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
