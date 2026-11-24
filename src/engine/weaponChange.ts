/**
 * Branş (silah) değiştirme — SAF mantık (kullanıcı 24.11). Oyuncu kariyer ortasında silahını değiştirebilir
 * (epe→flöre gibi). Kurallar:
 *  - Temel yetenekler KALICI düşmez; sadece GEÇİCİ uyum (keskinlik düşer, antrenmanla toparlar).
 *  - Maliyet = (a) yeni silaha özel EKSİK ekipman (ortak parçalar taşınır) + (b) ARTAN branş ücreti.
 *  - Artan ücret: 100 → 200 → 400 … (her değişimde ×2) — seri değişimi caydırır.
 *  - Sezonda (Quarter = oyun yılı) EN FAZLA 1 kez.
 *  - Bakiye yetmezse YAPILAMAZ (hesap asla eksiye düşmez — sunucu da doğrular).
 *  - Klasman: yeni silah = yeni kategori → sıralama sıfırdan (eski silahtaki puan terk edilir). (DB tarafı uygular.)
 *
 * I/O yok; DB/HTTP yok. careerService bu planı kullanıp uygular + doğrular.
 */
import type { Weapon, Gender } from "./domain";
import { itemsForWeapon, type KitItemState, type GladiusItem } from "./equipment";
import { quarterOf } from "./season";

/** 1. değişim ücreti; her değişimde ×2 (100→200→400…). Ayarlanabilir (beta dengesi). */
export const WEAPON_CHANGE_BASE_FEE = 100;
/** Değişim sonrası keskinlik (geçici uyum düşüşü) — yeni silaha alışırken "pas". Antrenmanla toparlar. */
export const WEAPON_CHANGE_SHARPNESS = 25;

/** Artan branş ücreti: 100 × 2^(önceki değişim sayısı). 0→100, 1→200, 2→400… */
export function weaponChangeFee(priorChanges: number): number {
  return WEAPON_CHANGE_BASE_FEE * Math.pow(2, Math.max(0, priorChanges));
}

/**
 * Yeni silaha geçiş için ALINMASI gereken (eksik) ekipman + toplam fiyatı.
 * Yalnız yeni silaha-ÖZEL (silah/maske/kordon/yelek/eldiven) ve elde OLMAYAN parçalar sayılır;
 * ortak parçalar (ceket/pantolon/ayakkabı/plastron/çorap) taşınır → bedava.
 */
export function weaponSwitchEquipment(
  newWeapon: Weapon,
  currentKit: readonly KitItemState[],
  gender?: Gender,
): { missing: GladiusItem[]; cost: number } {
  const have = new Set(currentKit.map((k) => k.itemId));
  const needed = itemsForWeapon(newWeapon, gender).filter((i) => !i.cosmetic && i.weapon === newWeapon);
  const missing = needed.filter((i) => !have.has(i.id));
  return { missing, cost: missing.reduce((s, i) => s + i.denar, 0) };
}

/** Bu sezon (Quarter) değiştirilebilir mi? lastChangeDay<0 = hiç değiştirmemiş → serbest. */
export function canChangeWeaponThisSeason(lastChangeDay: number, currentDay: number): boolean {
  if (lastChangeDay < 0) return true;
  return quarterOf(currentDay) > quarterOf(lastChangeDay);
}

export interface WeaponChangePlan {
  newWeapon: Weapon;
  equipmentCost: number; // eksik ekipman toplamı
  missing: GladiusItem[]; // alınacak parçalar (UI döküm)
  fee: number; // artan branş ücreti
  total: number; // equipmentCost + fee
  affordable: boolean; // bakiye >= total
  allowedThisSeason: boolean; // sezon kuralı
  canDo: boolean; // affordable && allowedThisSeason (ve yeni silah ≠ mevcut)
}

/** Bir silah değişimi planını (maliyet + kurallar) hesaplar. Uygulamaz — sadece önizleme/doğrulama için. */
export function planWeaponChange(opts: {
  newWeapon: Weapon;
  currentWeapon: Weapon;
  currentKit: readonly KitItemState[];
  gender?: Gender;
  balance: number;
  priorChanges: number;
  lastChangeDay: number;
  currentDay: number;
}): WeaponChangePlan {
  const { missing, cost } = weaponSwitchEquipment(opts.newWeapon, opts.currentKit, opts.gender);
  const fee = weaponChangeFee(opts.priorChanges);
  const total = cost + fee;
  const affordable = opts.balance >= total;
  const allowedThisSeason = canChangeWeaponThisSeason(opts.lastChangeDay, opts.currentDay);
  const differentWeapon = opts.newWeapon !== opts.currentWeapon;
  return {
    newWeapon: opts.newWeapon,
    equipmentCost: cost,
    missing,
    fee,
    total,
    affordable,
    allowedThisSeason,
    canDo: differentWeapon && affordable && allowedThisSeason,
  };
}
