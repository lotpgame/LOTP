/**
 * FIE pul kağıdı (poule sheet) — "Pist Konsolu" çizimi.
 * NxN ızgara: satır i'nin sütun j'ye karşı sonucu. "V5" = galibiyet (5 tuş attı), "3" = mağlubiyet (3 tuş attı).
 * Köşegen taralı. Ad sütunu yatay kaydırmada sabit kalır. Kendi satırın ve sütunun koyu zeminle (artı işareti gibi)
 * işaretli: satır = senin rakiplere karşı sonuçların, sütun = rakiplerin sana karşı sonuçları.
 */
import { t, type Locale } from "@/i18n";
import type { PoolSheetDTO } from "@/server/careerService";

const SUMMARY = [
  { key: "V", titleKey: "pul.victories" },
  { key: "TS", titleKey: "pul.scored" },
  { key: "TR", titleKey: "pul.received" },
  { key: "Ind", titleKey: "pul.indicator" },
] as const;

export function PulKagidi({ sheet, locale }: { sheet: PoolSheetDTO; locale: Locale }) {
  const me = sheet.players.findIndex((p) => p.isHuman);
  const cell = "h-9 w-9 min-w-9 border-t border-l border-line text-center";
  const sum = "h-9 min-w-10 border-t border-l border-line px-1.5 text-center";

  return (
    <figure className="panel overflow-hidden">
      <figcaption className="flex min-h-10 items-center border-b border-line px-3">
        <span className="kicker">{t(locale, "round.pool", { n: sheet.poolNumber })}</span>
      </figcaption>
      <div className="overflow-x-auto">
        <table className="num min-w-full border-separate border-spacing-0 text-[14px] font-normal">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 h-9 w-full bg-arena-1 px-3 text-left font-sans text-[12px] font-medium text-steel"
              >
                {t(locale, "pul.fencer")}
              </th>
              {sheet.players.map((_, j) => (
                <th
                  key={j}
                  scope="col"
                  className={`h-9 w-9 min-w-9 border-l border-line text-center text-[12px] ${
                    j === me ? "bg-arena-2 text-ink" : "font-medium text-steel"
                  }`}
                >
                  {j + 1}
                </th>
              ))}
              {SUMMARY.map((s, k) => (
                <th
                  key={s.key}
                  scope="col"
                  title={t(locale, s.titleKey)}
                  className={`h-9 min-w-10 border-l px-1.5 text-center text-[12px] font-medium text-steel ${
                    k === 0 ? "border-l-2 border-l-ink/40" : "border-line"
                  }`}
                >
                  {s.key}
                </th>
              ))}
              <th scope="col" className="h-9 min-w-11 border-l border-line px-1.5 text-center font-sans text-[12px] font-medium text-steel">
                {t(locale, "pul.place")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sheet.players.map((p, i) => {
              const mine = i === me;
              const rowBg = mine ? "bg-arena-2" : "bg-arena-1";
              return (
                <tr key={i}>
                  <th
                    scope="row"
                    className={`sticky left-0 z-10 h-9 border-t border-line px-3 text-left font-sans font-normal ${rowBg}`}
                  >
                    {mine && <span className="absolute inset-y-0 left-0 w-[3px] bg-sig-red" aria-hidden="true" />}
                    <span className="flex max-w-[9.5rem] items-center gap-2 sm:max-w-[14rem]">
                      <span className="num w-4 shrink-0 text-right text-[12px] text-steel">{i + 1}</span>
                      <span className={`truncate ${mine ? "font-semibold" : ""}`}>{p.name}</span>
                    </span>
                  </th>
                  {sheet.cells[i].map((c, j) => {
                    if (i === j) return <td key={j} className={`${cell} hatch`} aria-hidden="true" />;
                    const cross = mine || j === me ? "bg-arena-2" : "";
                    if (!c) return <td key={j} className={`${cell} text-steel ${cross}`}>—</td>;
                    return (
                      <td key={j} className={`${cell} relative ${cross} ${c.won ? "font-bold text-ink" : "text-steel"}`}>
                        {/* Galibiyet: köşede küçük lamba noktası (renk anlamı yok, yalnız "tuşu aldı" işareti) */}
                        {c.won && <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-ink" aria-hidden="true" />}
                        {c.won ? `V${c.scored}` : c.scored}
                      </td>
                    );
                  })}
                  <td className={`${sum} border-l-2 border-l-ink/40 font-bold ${rowBg}`}>{p.v}</td>
                  <td className={`${sum} ${rowBg}`}>{p.ts}</td>
                  <td className={`${sum} ${rowBg}`}>{p.tr}</td>
                  <td className={`${sum} ${rowBg}`}>
                    {p.ind > 0 ? "+" : ""}
                    {p.ind}
                  </td>
                  <td className={`${sum} font-bold ${rowBg}`}>{p.place}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
