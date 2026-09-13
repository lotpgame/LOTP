/**
 * Kariyer sayfalarında ortak sunum bileşenleri (saf; hook yok → server component'lerde kullanılır).
 */
import type { SkillCategory } from "@/engine/domain";
import type { CareerDTO } from "@/server/careerService";

export const CATEGORY_LABEL_TR: Record<SkillCategory, string> = {
  TECHNICAL: "Teknik",
  PHYSICAL: "Fiziksel",
  MENTAL: "Mental",
  TACTICAL: "Taktik",
};

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Küçük durum kutusu (isteğe bağlı dolu-çubuk göstergesi). */
export function Stat({ label, value, gauge }: { label: string; value: string; gauge?: number }) {
  const gaugeColor =
    gauge == null ? "" : gauge >= 50 ? "bg-emerald-500" : gauge >= 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-semibold">{value}</div>
      {gauge != null && (
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div className={`h-full rounded-full ${gaugeColor}`} style={{ width: `${gauge}%` }} />
        </div>
      )}
    </div>
  );
}

export function StatBar({ label, value, tone = "ok" }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums opacity-70">%{value.toFixed(0)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div
          className={`h-full rounded-full ${tone === "warn" ? "bg-amber-500" : "bg-emerald-500"}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function SkillBar({ label, current, potential }: { label: string; current: number; potential: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums opacity-70">
          {current.toFixed(1)}
          <span className="opacity-50"> / {potential.toFixed(0)}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${current}%` }} />
      </div>
    </li>
  );
}

export function RankingTable({ ranking, quarter }: { ranking: CareerDTO["ranking"]; quarter: number }) {
  if (ranking.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold">Quarter Ranking (Q{quarter})</h2>
        <p className="mt-1 text-sm opacity-60">
          Bu quarter henüz turnuva oynanmadı. İlk turnuvadan sonra sıralama oluşur (quarter sonunda
          sıfırlanır).
        </p>
      </div>
    );
  }
  return (
    <div>
      <h2 className="text-lg font-semibold">Quarter Ranking (Q{quarter})</h2>
      <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
        {ranking.map((r) => (
          <li
            key={r.playerId}
            className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
              r.isHuman ? "bg-emerald-500/10 font-medium" : ""
            }`}
          >
            <span className="min-w-0">
              <span className="inline-block w-6 tabular-nums opacity-60">{r.position}.</span>
              {r.name}
              {r.isHuman ? " (sen)" : ""}
              {r.clubName ? <span className="ml-1 text-xs opacity-50">· {r.clubName}</span> : null}
            </span>
            <span className="shrink-0 tabular-nums opacity-70">{r.points.toFixed(1)} p</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
