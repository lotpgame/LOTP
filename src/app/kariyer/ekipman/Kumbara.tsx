/**
 * Kumbaram — çocuğun cebindeki para + "o hafta neye ne harcadı ne aldı" (kullanıcı kararı 06.11).
 * Server bileşeni: CareerDTO'dan ledgerWeek + totals okur. Veri kaynağı src/engine/ledger.ts (işlem kaydı).
 */
import { itemById, itemName } from "@/engine/equipment";
import type { LedgerEntry } from "@/engine/ledger";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";
import { DenarMark } from "../DenarMark";

/** Bir işlem kaydının gösterilecek etiketi (malzeme → ürün adı; diğerleri → ledger.<key>). */
function entryLabel(e: LedgerEntry, locale: Locale): string {
  if (e.key === "equipment" && e.arg) {
    const item = itemById(e.arg);
    if (item) return itemName(item, locale);
  }
  return t(locale, `ledger.${e.key}`);
}

export function Kumbara({
  balance,
  entries,
  totals,
  locale,
}: {
  balance: number;
  entries: readonly LedgerEntry[];
  totals: { income: number; expense: number; net: number };
  locale: Locale;
}) {
  // En yeni üstte.
  const rows = [...entries].reverse();
  return (
    <div className="border-t border-line px-4 pb-4 pt-3">
      {/* Cebindeki para */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-[14px] text-steel">{t(locale, "kumbara.pocket")}</span>
        <span className="flex items-center gap-1.5 text-[22px] font-bold">
          <DenarMark size={20} /> <span className="num">{balance.toFixed(0)}</span>
        </span>
      </div>

      {/* Bu hafta gelir/gider/net */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="panel p-2">
          <div className="kicker text-[10px] text-steel">{t(locale, "kumbara.income")}</div>
          <div className="num text-[15px] font-semibold text-sig-green">+{totals.income}</div>
        </div>
        <div className="panel p-2">
          <div className="kicker text-[10px] text-steel">{t(locale, "kumbara.expense")}</div>
          <div className="num text-[15px] font-semibold text-sig-red">{totals.expense}</div>
        </div>
        <div className="panel p-2">
          <div className="kicker text-[10px] text-steel">{t(locale, "kumbara.net")}</div>
          <div className={`num text-[15px] font-semibold ${totals.net >= 0 ? "text-sig-green" : "text-sig-red"}`}>
            {totals.net >= 0 ? "+" : ""}{totals.net}
          </div>
        </div>
      </div>

      {/* Bu haftanın işlemleri */}
      <div className="kicker mt-4 mb-1.5">{t(locale, "kumbara.thisWeek")}</div>
      {rows.length === 0 ? (
        <p className="text-[13px] text-steel">{t(locale, "kumbara.empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {rows.map((e, i) => {
            const income = e.amount >= 0;
            return (
              <li key={i} className="flex items-center justify-between gap-3 py-2">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${income ? "bg-sig-green/15 text-sig-green" : "bg-sig-red/15 text-sig-red"}`}>
                    <Icon name={income ? "chevron-down" : "chevron-down"} size={14} className={income ? "rotate-180" : ""} />
                  </span>
                  <span className="truncate text-[14px]">{entryLabel(e, locale)}</span>
                </span>
                <span className={`num shrink-0 text-[14px] font-semibold ${income ? "text-sig-green" : "text-sig-red"}`}>
                  {income ? "+" : ""}{e.amount} <DenarMark size={12} />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
