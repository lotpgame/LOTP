/**
 * Manşet cümleleri — turnuva sonucunu gazete manşetine çevirir (Sonuç ekranı, geçmiş turnuva, "Sen yokken",
 * WhatsApp paylaşım metni). YALNIZ mevcut sonuç verisinden ve çeviri şablonlarından kurulur; motor metni üretmez.
 * Türkçe ek sorunu olmasın diye değişken isimlere ek getirilmez ("{tournament}: {name} …", "{opp} karşısında").
 */
import { t, type Locale } from "@/i18n";

export interface HeadlineInput {
  name: string; // sporcunun adı
  tournament: string; // "U10 İl Şampiyonası"
  position: number; // final derecesi (FIE eşitlikli: 1, 2, 3, 5, 9, 17, 33 … ya da pulda elenen n)
  fieldSize?: number; // katılımcı sayısı
  pool?: { wins: number; losses: number; indicator: number } | null;
  lastBout?: { round: string; opp: string; scoreHuman: number; scoreOpp: number } | null; // son eleme maçı
}

export interface Headline {
  title: string;
  deck: string[]; // alt satır parçaları (" · " ile birleştirilir)
  champion: boolean;
}

// Eleme derecesi → manşet anahtarı. Türkçe sayı ekleri sabit ("son 16'da", "son 64'te") → her tur ayrı anahtar.
const TITLE_BY_POSITION: Record<number, string> = {
  1: "headline.champion",
  2: "headline.silver",
  3: "headline.bronze",
  5: "headline.last8",
  9: "headline.last16",
  17: "headline.last32",
  33: "headline.last64",
};

export function buildHeadline(locale: Locale, h: HeadlineInput): Headline {
  const vars = { name: h.name, tournament: h.tournament, n: h.position };
  const title = t(locale, TITLE_BY_POSITION[h.position] ?? "headline.place", vars);

  const deck: string[] = [];
  if (h.lastBout) {
    deck.push(
      t(locale, "headline.deckBout", {
        round: h.lastBout.round,
        opp: h.lastBout.opp,
        score: `${h.lastBout.scoreHuman}–${h.lastBout.scoreOpp}`,
      }),
    );
  }
  if (h.pool) {
    const ind = h.pool.indicator > 0 ? `+${h.pool.indicator}` : String(h.pool.indicator);
    deck.push(t(locale, "headline.deckPool", { v: h.pool.wins, d: h.pool.losses, ind }));
  }
  if (h.fieldSize) deck.push(t(locale, "headline.deckField", { n: h.fieldSize }));

  return { title, deck, champion: h.position === 1 };
}

/** WhatsApp'a hazır metin — kullanıcı kendisi gönderir (otomatik gönderim yok). */
export function headlineShareText(locale: Locale, h: Headline, url: string): string {
  const lines = [h.title];
  if (h.deck.length) lines.push(h.deck.join(" · "));
  lines.push("", t(locale, "headline.shareTail", { url }));
  return lines.join("\n");
}

/** Sporcunun son eleme maçı (varsa) — canlı turnuva ve geçmiş turnuva maç listesi aynı alanları taşır. */
export function lastBoutFrom(
  matches: readonly { phase: string; round: string; aName: string; bName: string; scoreA: number; scoreB: number; aIsHuman: boolean; bIsHuman: boolean }[],
): HeadlineInput["lastBout"] {
  const m = [...matches].reverse().find((x) => x.phase === "DE" && (x.aIsHuman || x.bIsHuman));
  if (!m) return null;
  return m.aIsHuman
    ? { round: m.round, opp: m.bName, scoreHuman: m.scoreA, scoreOpp: m.scoreB }
    : { round: m.round, opp: m.aName, scoreHuman: m.scoreB, scoreOpp: m.scoreA };
}
