/**
 * Kariyer sayfalarında ortak sunum bileşenleri (saf; hook yok → server component'lerde kullanılır).
 */
import type { SkillCategory } from "@/engine/domain";
import { t, type Locale } from "@/i18n";
import type { CareerDTO } from "@/server/careerService";

export const CATEGORY_LABEL_TR: Record<SkillCategory, string> = {
  TECHNICAL: "Teknik",
  PHYSICAL: "Fiziksel",
  MENTAL: "Mental",
  TACTICAL: "Taktik",
};

export const CATEGORY_ICON: Record<SkillCategory, string> = {
  TECHNICAL: "🤺",
  PHYSICAL: "💪",
  MENTAL: "🧠",
  TACTICAL: "♟️",
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

/** Küçük durum kutusu (ikon + isteğe bağlı dolu-çubuk göstergesi). */
export function Stat({
  label,
  value,
  gauge,
  icon,
}: {
  label: string;
  value: string;
  gauge?: number;
  icon?: string;
}) {
  const gaugeColor =
    gauge == null ? "" : gauge >= 50 ? "bg-emerald-500" : gauge >= 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="rounded-xl border border-black/10 bg-black/[0.015] px-3 py-2 dark:border-white/15 dark:bg-white/[0.02]">
      <div className="flex items-center gap-1 text-xs opacity-60">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </div>
      <div className="mt-0.5 font-semibold">{value}</div>
      {gauge != null && (
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
          <div className={`h-full rounded-full ${gaugeColor} transition-all`} style={{ width: `${gauge}%` }} />
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

export function SkillBar({ label, current }: { label: string; current: number; potential?: number }) {
  // Sade: yalnız mevcut değer (0–100). Gizli tavan ekranda gösterilmez.
  return (
    <li>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums opacity-70">{current.toFixed(1)}</span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${current}%` }} />
      </div>
    </li>
  );
}

/** 4 kategori altında mevcut yetenekleri gösterir (Profil ve Antrenman ortak kullanır). */
export function SkillsByCategory({
  skills,
  locale,
}: {
  skills: { key: string; label: string; category: string; current: number }[];
  locale: Locale;
}) {
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {(Object.keys(CATEGORY_LABEL_TR) as SkillCategory[]).map((cat) => (
        <div key={cat}>
          <h3 className="mb-2 text-sm font-medium opacity-80">
            {CATEGORY_ICON[cat]} {t(locale, `category.${cat}`)}
          </h3>
          <ul className="space-y-2">
            {skills
              .filter((s) => s.category === cat)
              .map((s) => (
                <SkillBar key={s.key} label={s.label} current={s.current} />
              ))}
          </ul>
        </div>
      ))}
    </div>
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
