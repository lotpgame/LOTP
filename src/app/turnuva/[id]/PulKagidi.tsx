/**
 * Klasik FIE pul kağıdı (poule sheet): NxN sonuç ızgarası + V/TS/TR/Ind/Sıra.
 * Hücre "V5" = galibiyet (5 tuş attı), "3" = mağlubiyet (3 tuş attı). Köşegen kapalı.
 */
import { t, type Locale } from "@/i18n";
import type { PoolSheetDTO } from "@/server/careerService";

export function PulKagidi({ sheet, locale }: { sheet: PoolSheetDTO; locale: Locale }) {
  const cellCls = "num border border-line p-1 text-center";
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-xs">
        <thead>
          <tr>
            <th className="border border-line p-1 text-left">
              {t(locale, "round.pool", { n: sheet.poolNumber })}
            </th>
            {sheet.players.map((_, j) => (
              <th key={j} className="w-7 border border-line p-1 text-center text-steel">
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
            <tr key={i} className={p.isHuman ? "bg-arena-2 font-semibold" : ""}>
              <td className={`whitespace-nowrap border border-line p-1 ${p.isHuman ? "border-l-[3px] border-l-sig-red" : ""}`}>
                <span className="mr-1 text-steel">{i + 1}</span>
                {p.name}
              </td>
              {sheet.cells[i].map((c, j) => (
                <td
                  key={j}
                  className={`w-7 num border border-line p-1 text-center ${
                    i === j ? "bg-line" : c?.won ? "font-bold text-ink" : "text-steel"
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
