import { describe, expect, it } from "vitest";
import {
  weaponChangeFee,
  weaponSwitchEquipment,
  canChangeWeaponThisSeason,
  planWeaponChange,
  WEAPON_CHANGE_BASE_FEE,
} from "@/engine/weaponChange";
import { starterKit } from "@/engine/equipment";
import { DAYS_PER_QUARTER } from "@/engine/season";

describe("Branş (silah) değiştirme — motor (kullanıcı 24.11)", () => {
  it("artan ücret: 100 → 200 → 400 (her değişimde ×2)", () => {
    expect(weaponChangeFee(0)).toBe(100);
    expect(weaponChangeFee(1)).toBe(200);
    expect(weaponChangeFee(2)).toBe(400);
    expect(WEAPON_CHANGE_BASE_FEE).toBe(100);
  });

  it("eksik ekipman: yeni silaha özel parçalar alınır, ortaklar taşınır (bedava)", () => {
    const epeeKit = starterKit("EPEE"); // epe takımı (silah/maske/kordon + ortaklar)
    const { missing, cost } = weaponSwitchEquipment("FOIL", epeeKit);
    // Flöreye geçişte flöre-özel parçalar eksik olmalı (silah/maske/yelek/kordon/maske kordonu/eldiven).
    expect(missing.length).toBeGreaterThan(0);
    expect(cost).toBeGreaterThan(0);
    // Hepsi flöre-özel (weapon === FOIL); ortak parça (ceket/ayakkabı) listede OLMAMALI.
    expect(missing.every((i) => i.weapon === "FOIL")).toBe(true);
    expect(missing.some((i) => i.id === "gl-clothing")).toBe(false);
  });

  it("aynı silaha 'geçişte' eksik yok (zaten elinde)", () => {
    const foilKit = starterKit("FOIL");
    const { missing, cost } = weaponSwitchEquipment("FOIL", foilKit);
    expect(missing.length).toBe(0);
    expect(cost).toBe(0);
  });

  it("sezon kuralı: hiç değiştirmemiş serbest; aynı sezon kapalı; sonraki sezon açık", () => {
    expect(canChangeWeaponThisSeason(-1, 10)).toBe(true); // hiç değiştirmemiş
    expect(canChangeWeaponThisSeason(5, 20)).toBe(false); // aynı quarter (sezon) → kapalı
    expect(canChangeWeaponThisSeason(5, 5 + DAYS_PER_QUARTER)).toBe(true); // sonraki sezon → açık
  });

  it("planWeaponChange: bakiye + sezon + farklı silah kurallarını birleştirir", () => {
    const epeeKit = starterKit("EPEE");
    const { cost } = weaponSwitchEquipment("FOIL", epeeKit);
    const fee = weaponChangeFee(0);
    const total = cost + fee;
    // Yeterli bakiye + ilk sezon → yapılabilir
    const ok = planWeaponChange({
      newWeapon: "FOIL", currentWeapon: "EPEE", currentKit: epeeKit,
      balance: total, priorChanges: 0, lastChangeDay: -1, currentDay: 10,
    });
    expect(ok.total).toBe(total);
    expect(ok.canDo).toBe(true);
    // Bakiye 1 eksik → yapılamaz (hesap eksiye düşmesin)
    const poor = planWeaponChange({
      newWeapon: "FOIL", currentWeapon: "EPEE", currentKit: epeeKit,
      balance: total - 1, priorChanges: 0, lastChangeDay: -1, currentDay: 10,
    });
    expect(poor.affordable).toBe(false);
    expect(poor.canDo).toBe(false);
    // Aynı sezonda ikinci kez → kapalı
    const sameSeason = planWeaponChange({
      newWeapon: "SABRE", currentWeapon: "EPEE", currentKit: epeeKit,
      balance: 99999, priorChanges: 1, lastChangeDay: 10, currentDay: 20,
    });
    expect(sameSeason.allowedThisSeason).toBe(false);
    expect(sameSeason.canDo).toBe(false);
    // Aynı silah → yapılamaz
    const same = planWeaponChange({
      newWeapon: "EPEE", currentWeapon: "EPEE", currentKit: epeeKit,
      balance: 99999, priorChanges: 0, lastChangeDay: -1, currentDay: 10,
    });
    expect(same.canDo).toBe(false);
  });
});
