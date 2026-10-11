/**
 * Turnuva seviyesine göre renk (kullanıcı 11.10): İl→yeşil, Türkiye→kırmızı, Open→nötr, Satellite→mavi,
 * Avrupa→mor, Grand Prix→amber, Dünya Kupası→altın. `bar` = sol şerit/tint, `tag` = etiket çerçeve+yazı.
 * SAF (React yok) → hem sunucu hem istemci bileşenleri kullanabilir ("use client" DEĞİL).
 */
const LEVEL_COLOR: Record<string, { bar: string; tag: string }> = {
  IL: { bar: "bg-emerald-500", tag: "border-emerald-500/40 text-emerald-400" },
  TURKIYE: { bar: "bg-rose-500", tag: "border-rose-500/40 text-rose-400" },
  OPEN: { bar: "bg-slate-500", tag: "border-line text-steel" },
  SATELLITE: { bar: "bg-sky-500", tag: "border-sky-500/40 text-sky-400" },
  EUROPEAN: { bar: "bg-violet-500", tag: "border-violet-500/40 text-violet-400" },
  GRAND_PRIX: { bar: "bg-amber-500", tag: "border-amber-500/40 text-amber-400" },
  WORLD_CUP: { bar: "bg-yellow-400", tag: "border-yellow-400/50 text-yellow-300" },
};

export function levelColor(level: string): { bar: string; tag: string } {
  return LEVEL_COLOR[level] ?? { bar: "bg-ink", tag: "border-line text-ink" };
}
