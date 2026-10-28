import { describe, expect, it } from "vitest";
import { pickAvatar } from "@/engine/avatars";
import manifest from "@/data/avatarManifest.json";

describe("Avatar atama (otomatik, cinsiyete göre)", () => {
  it("cinsiyete uygun havuzdan GEÇERLİ bir set seçer", () => {
    expect(manifest.b).toContain(pickAvatar("MALE", "p1"));
    expect(manifest.g).toContain(pickAvatar("FEMALE", "p1"));
  });

  it("deterministiktir — aynı oyuncu (seed) hep aynı yüzü alır", () => {
    expect(pickAvatar("MALE", "player-42")).toBe(pickAvatar("MALE", "player-42"));
    expect(pickAvatar("FEMALE", "ali")).toBe(pickAvatar("FEMALE", "ali"));
  });

  it("farklı seed'ler çeşitlilik verir (havuz > 1 iken en az iki farklı sonuç)", () => {
    const seen = new Set(Array.from({ length: 20 }, (_, i) => pickAvatar("FEMALE", `s${i}`)));
    expect(seen.size).toBeGreaterThan(1);
  });
});
