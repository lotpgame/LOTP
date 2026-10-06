import { describe, expect, it } from "vitest";
import { parseSkillQuarterBase, rollSkillQuarterBase } from "@/engine/skill/quarterBase";

describe("çeyrek başı yetenek değerleri (radar)", () => {
  it("kayıt yoksa şimdiki değerleri o çeyrek için dondurur (2 ondalığa yuvarlar)", () => {
    expect(rollSkillQuarterBase(null, 1, { attack: 12.3456, speed: 9 })).toEqual({ q: 1, v: { attack: 12.35, speed: 9 } });
  });

  it("aynı çeyrekte kaydı korur, yeni çeyreğe girince yeniden dondurur", () => {
    const q1 = rollSkillQuarterBase(null, 1, { attack: 10 });
    expect(rollSkillQuarterBase(q1, 1, { attack: 14 })).toBe(q1);
    expect(rollSkillQuarterBase(q1, 2, { attack: 14 })).toEqual({ q: 2, v: { attack: 14 } });
  });

  it("kayıtlı JSON'u okur; boş ya da bozuk kayıtta null döner", () => {
    expect(parseSkillQuarterBase(JSON.stringify({ q: 3, v: { timing: 7.5 } }))).toEqual({ q: 3, v: { timing: 7.5 } });
    expect(parseSkillQuarterBase(null)).toBeNull();
    expect(parseSkillQuarterBase("{bozuk")).toBeNull();
    expect(parseSkillQuarterBase(JSON.stringify({ v: {} }))).toBeNull();
  });
});
