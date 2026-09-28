import { describe, expect, it } from "vitest";
import { buildWeek } from "@/app/kariyer/week";

// Dünya günü 0 = Pazartesi (engine: dayOfWeek = gün % 7).
const plan = ["TECHNICAL", "PHYSICAL", "REST", "MENTAL", "TACTICAL", "REST", "TECHNICAL"];

describe("7 günlük hafta şeridi", () => {
  it("bugünden başlar, 7 gün, gün adları sırayla", () => {
    const w = buildWeek(8, plan, [], null); // 8 = Salı
    expect(w).toHaveLength(7);
    expect(w.map((d) => d.dow)).toEqual([1, 2, 3, 4, 5, 6, 0]);
    expect(w[0].today).toBe(true);
    expect(w.slice(1).every((d) => !d.today)).toBe(true);
  });

  it("yaklaşan turnuvalar etiket + kayıt durumuyla; diğer günler plandaki seans", () => {
    const upcoming = [
      { worldDay: 10, level: "TURKIYE", label: "U10 Türkiye Şampiyonası", registered: true, qualified: true },
      { worldDay: 12, level: "OPEN", label: "U10 Open Turnuva", registered: false, qualified: true },
    ];
    const w = buildWeek(7, plan, upcoming, { dow: 0, kind: "TRAINING" }); // 7 = Pazartesi
    expect(w[0]).toMatchObject({ today: true, kind: "TRAINING", training: "TECHNICAL" });
    expect(w[3]).toMatchObject({ kind: "TOURNAMENT", level: "TURKIYE", registered: true });
    expect(w[5]).toMatchObject({ kind: "TOURNAMENT", level: "OPEN", registered: false });
    // Salı (8) yaklaşan listede yok → plandaki seans gösterilir
    expect(w[1]).toMatchObject({ kind: "TRAINING", training: "PHYSICAL" });
  });

  it("bugün turnuva günüyse bugünün bilgisini kullanır (kayıt bilgisi yok)", () => {
    const w = buildWeek(8, plan, [], { dow: 1, kind: "TOURNAMENT", level: "IL", label: "U10 İl Şampiyonası", qualified: true });
    expect(w[0]).toMatchObject({ today: true, kind: "TOURNAMENT", level: "IL" });
    expect(w[0].registered).toBeUndefined();
  });

  it("kariyer günü geride kaldıysa şerit başlıktaki günle başlar (Bugün kartıyla aynı gün)", () => {
    // Dünya günü 13 = Pazar; kariyer hâlâ Cumartesi'nin (12) Open turnuvasında.
    const stale = { dow: 5, kind: "TOURNAMENT" as const, level: "OPEN", label: "U10 Open Turnuva", qualified: true };
    const w = buildWeek(13, plan, [], stale);
    expect(w[0]).toMatchObject({ worldDay: 12, today: true, dow: 5, kind: "TOURNAMENT", level: "OPEN" });
    expect(w[1]).toMatchObject({ worldDay: 13, today: false, dow: 6, kind: "TRAINING" });
    // Dünya 8 = Salı, kariyer Pazartesi'de (7): aradaki Salı kaydı kapanmış İl turnuvası → programdan, kayıt bilgisi yok
    const w2 = buildWeek(8, plan, [], { dow: 0, kind: "TRAINING" });
    expect(w2[0]).toMatchObject({ worldDay: 7, today: true, kind: "TRAINING", training: "TECHNICAL" });
    expect(w2[1]).toMatchObject({ worldDay: 8, kind: "TOURNAMENT", level: "IL" });
    expect(w2[1].registered).toBeUndefined();
  });
});
