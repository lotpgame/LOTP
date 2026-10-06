/**
 * Yetenek radarı (Bugün ekranı, docs/GORSEL_ETKILESIM.md §8): 10 alt yetenek ekseni; DOLU alan = şimdiki,
 * KESİKLİ = geçen çeyrek (çeyrek başında dondurulan değerler), büyüyen eksende yeşil "+N". Ölçek, yetenek
 * çubuklarıyla aynı yaş grubu bandı (bandMax). Saf SVG + konumlu etiketler; hook yok.
 */
import { t, type Locale } from "@/i18n";
import { radarGrowth, radarPoint, radarPolygon } from "@/app/ui/radar";

const R = 76; // radar yarıçapı (px) — telefonda en uzun etiket ("Soğukkanlılık") sığsın diye
const LABEL_R = 92;
const BOX = 2 * (R + 6);
const RINGS = [0.25, 0.5, 0.75, 1];

export function SkillRadar({
  skills,
  base,
  max,
  locale,
}: {
  skills: { key: string; label: string; current: number }[];
  base: Record<string, number> | null;
  max: number;
  locale: Locale;
}) {
  const n = skills.length;
  const prev = base ? skills.map((s) => base[s.key] ?? s.current) : null;
  return (
    <figure className="panel pt-2 pb-3">
      <div className="relative mx-auto h-[272px] w-full max-w-[360px]">
        <svg
          viewBox={`${-BOX / 2} ${-BOX / 2} ${BOX} ${BOX}`}
          width={BOX}
          height={BOX}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        >
          {RINGS.map((k) => (
            <polygon key={k} points={radarPolygon(Array(n).fill(max * k), max, R)} fill="none" stroke="var(--line)" strokeWidth={1} />
          ))}
          {skills.map((s, i) => {
            const p = radarPoint(i, n, R);
            return <line key={s.key} x1={0} y1={0} x2={p.x} y2={p.y} stroke="var(--line)" strokeWidth={1} />;
          })}
          {prev && (
            <polygon points={radarPolygon(prev, max, R)} fill="none" stroke="var(--steel)" strokeWidth={1.5} strokeDasharray="4 3" />
          )}
          <polygon
            points={radarPolygon(skills.map((s) => s.current), max, R)}
            fill="var(--ink)"
            fillOpacity={0.16}
            stroke="var(--ink)"
            strokeWidth={1.75}
            strokeLinejoin="round"
          />
        </svg>
        {skills.map((s, i) => {
          const p = radarPoint(i, n, LABEL_R);
          const growth = radarGrowth(s.current, prev?.[i]);
          // Etiket eksenin dış ucunda: sağdakiler sola yaslı, soldakiler sağa yaslı, tepe/dip ortalı.
          const align = p.x > 8 ? "text-left" : p.x < -8 ? "text-right" : "text-center";
          const shift = p.x > 8 ? "-50%" : p.x < -8 ? "-50%" : p.y < 0 ? "-100%" : "0";
          const tx = p.x > 8 ? "0" : p.x < -8 ? "-100%" : "-50%";
          return (
            <span
              key={s.key}
              className={`absolute max-w-[80px] font-display text-[14px] leading-[1.1] ${align}`}
              style={{ left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)`, transform: `translate(${tx}, ${shift})` }}
            >
              {s.label}
              {growth >= 1 && <span className="num block text-[13px] text-sig-green">+{growth}</span>}
            </span>
          );
        })}
      </div>
      <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-1 px-3 text-[13px] text-steel">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-3.5 rounded-[2px] border border-ink bg-ink/20" aria-hidden="true" />
          {t(locale, "radar.now")}
        </span>
        {prev && (
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 border-t-[1.5px] border-dashed border-steel" aria-hidden="true" />
            {t(locale, "radar.lastQuarter")}
          </span>
        )}
        {prev && (
          <span className="inline-flex items-center gap-1">
            <span className="num text-sig-green">+N</span> {t(locale, "radar.growth")}
          </span>
        )}
      </figcaption>
    </figure>
  );
}
