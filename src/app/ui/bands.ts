/**
 * Değer gösterimi için yaş grubu ölçeği — YALNIZ GÖSTERİM (motor değerleri değişmez).
 * Neden: 0–100 ölçeğinde 8 yaşındaki sporcunun 9–12 değerleri "boş çubuk" gibi görünüyordu. Ray, değeri
 * yaş grubunun "üst sınırına" göre doldurur; mutlak 0–100 değer her zaman yanında yazılı kalır.
 * ⏳ Değerler taslak — Yusuf (antrenör) onaylayacak. Değiştirmek için yalnız bu tabloyu düzenle.
 */
export const BAND_MAX: Record<string, number> = {
  U10: 30,
  U12: 45,
  U14: 60,
  U17: 80,
  default: 100,
};

/** "U10-M-EP" veya "U10" → o yaş grubunun ölçek üst sınırı. */
export function bandMax(categoryOrAge: string): number {
  const age = categoryOrAge.split("-")[0];
  return BAND_MAX[age] ?? BAND_MAX.default;
}
