/**
 * Avatar yardımcıları (saf — DB/IO yok). Oyuncunun seçtiği avatar seti + yaşı → gösterilecek portre.
 * Portre yaşa göre otomatik değişir (8/12/16/20 kademesi): oyuncu büyüdükçe avatarı da büyür.
 * Dosyalar: public/img/avatars/<set>/<yaş>.webp (bkz. scripts/slice-avatars.mjs).
 * (Dosya adı Avatar.tsx ile Windows'ta çakışmasın diye "avatarImage".)
 */

export const AVATAR_STAGES = [8, 12, 16, 20] as const;

/** Yaşa karşılık gelen portre kademesi (en yakın alt eşik): 8–11→8, 12–15→12, 16–19→16, 20+→20. */
export function avatarStage(age: number): number {
  if (age >= 20) return 20;
  if (age >= 16) return 16;
  if (age >= 12) return 12;
  return 8;
}

// Set id biçimi: "b01" (erkek) / "g01" (kız). 2–3 haneli numara (ileride 100+ set).
const SET_RE = /^[bg]\d{2,3}$/;

/** Avatar portre yolu; set yoksa/geçersizse null → çağıran harf rozetine düşer (fallback). */
export function avatarSrc(set: string | null | undefined, age: number): string | null {
  if (!set || !SET_RE.test(set)) return null;
  return `/img/avatars/${set}/${avatarStage(age)}.webp`;
}
