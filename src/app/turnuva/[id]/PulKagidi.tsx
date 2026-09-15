/**
 * Klasik FIE pul kağıdı (poule sheet): NxN sonuç ızgarası + V/TS/TR/Ind/Sıra.
 * Hücre "V5" = galibiyet (5 tuş attı), "3" = mağlubiyet (3 tuş attı). Köşegen kapalı.
 */
import { t, type Locale } from "@/i18n";
import type { PoolSheetDTO } from "@/server/careerService";

export function PulKagidi({ sheet, locale }: { sheet: PoolSheetDTO; locale: Locale }) {
  const cellCls = "border border-black/15 p-1 text-center tabular-nums dark:border-white/20";
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-black/15 p-1 text-left dark:border-white/20">
              {t(locale, "round.pool", { n: sheet.poolNumber })}
            </th>
            {sheet.players.map((_, j) => (
              <th key={j} className="w-7 border border-black/15 p-1 text-center opacity-60 dark:border-white/20">
                {j + 1}
              </th>
            ))}
            <th className={cellCls}>V</th>
            <th className={cellCls}>TS</th>
            <th className={cellCls}>TR</th>
            <th className={cellCls}>Ind</th>
            <th className={cellCls}>{t(locale, "pul.place")}</th>
          </tr>
        </thead>
        <tbody>
          {sheet.players.map((p, i) => (
            <tr key={i} className={p.isHuman ? "bg-emerald-500/10 font-medium" : ""}>
              <td className="whitespace-nowrap border border-black/15 p-1 dark:border-white/20">
                <span className="mr-1 opacity-50">{i + 1}</span>
                {p.name}
              </td>
              {sheet.cells[i].map((c, j) => (
                <td
                  key={j}
                  className={`w-7 border border-black/15 p-1 text-center tabular-nums dark:border-white/20 ${
                    i === j ? "bg-black/25 dark:bg-white/25" : c?.won ? "text-emerald-700 dark:text-emerald-300" : ""
                  }`}
                >
                  {i === j ? "" : c ? (c.won ? `V${c.scored}` : `${c.scored}`) : "—"}
                </td>
              ))}
              <td className={`${cellCls} font-semibold`}>{p.v}</td>
              <td className={cellCls}>{p.ts}</td>
              <td className={cellCls}>{p.tr}</td>
              <td className={cellCls}>
                {p.ind >= 0 ? "+" : ""}
                {p.ind}
              </td>
              <td className={cellCls}>{p.place}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
