/**
 * Kariyer sayfalarında ortak sunum bileşenleri (saf; hook yok → server component'lerde kullanılır).
 */
import type { SkillCategory } from "@/engine/domain";
import { t, type Locale } from "@/i18n";
import type { RankingRowDTO } from "@/server/careerService";
import { Icon, type IconName } from "@/app/ui/Icon";
import { PisteRail, Segments } from "@/app/ui/Piste";
import { ageGroup, bandMax } from "@/app/ui/bands";

export const CATEGORY_LABEL_TR: Record<SkillCategory, string> = {
  TECHNICAL: "Teknik",
  PHYSICAL: "Fiziksel",
  MENTAL: "Mental",
  TACTICAL: "Taktik",
};

export const CATEGORY_ICON: Record<SkillCategory, IconName> = {
  TECHNICAL: "technical",
  PHYSICAL: "physical",
  MENTAL: "mental",
  TACTICAL: "tactical",
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

/** Küçük tam sayıyı Roma rakamına çevirir (sezon göstergesi: I, II, III…). */
export function toRoman(n: number): string {
  if (n <= 0) return String(n);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

/**
 * Küçük durum kutusu. `gauge` verilirse 10 parçalı gösterge çizilir (trafik lambası rengi yok);
 * `state` durumu yazıyla söyler ("Dinç", "Yorgun"…).
 */
export function Stat({
  label,
  value,
  gauge,
  glow,
  icon,
  state,
  word,
}: {
  label: string;
  value: string;
  gauge?: number;
  /** Gösterge yüksekken (Bugün: kondisyon/form ≥ %70) dolu parçalar hafifçe parlar (GORSEL §8). */
  glow?: boolean;
  icon?: IconName;
  state?: string;
  /** Değer sayı değil kelime (örn. gün adı): dar başlık fontu — mono'da "Cumartesi" kartı taşırıyordu. */
  word?: boolean;
}) {
  return (
    <div className="panel px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[13px] text-steel">
        {icon && <Icon name={icon} size={16} />}
        {label}
      </div>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={`${word ? "display" : "num"} text-[22px] leading-none`}>{value}</span>
        {state && <span className="text-[13px] text-steel">{state}</span>}
      </div>
      {gauge != null && <Segments value={gauge} glow={glow} className="mt-2" />}
    </div>
  );
}

/** Kondisyon/form durumunu yazıyla söyler (renk yerine). Eşikler yalnız gösterim içindir. */
export function conditionState(locale: Locale, v: number): string {
  return t(locale, v >= 80 ? "state.fresh" : v >= 50 ? "state.normal" : v >= 25 ? "state.tired" : "state.exhausted");
}
export function formState(locale: Locale, v: number): string {
  return t(locale, v >= 70 ? "state.sharp" : v >= 40 ? "state.average" : "state.rusty");
}

/** Yüzde değer + pist rayı (psikoloji). Stres de nötr ray — renk kötü/iyi demez. */
export function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-[14px]">
        <span>{label}</span>
        <span className="num text-[15px]">%{value.toFixed(0)}</span>
      </div>
      <PisteRail value={value} max={100} className="mt-1.5" />
    </div>
  );
}

export function SkillBar({ label, current, max, best }: { label: string; current: number; max: number; best?: boolean }) {
  return (
    <li>
      <div className="flex items-baseline justify-between text-[14px]">
        <span className="flex items-center gap-1.5">
          {label}
          {best && <span className="lamp lamp-prio h-1.5 w-1.5" aria-hidden="true" />}
        </span>
        <span className="num text-[15px]">{current.toFixed(1)}</span>
      </div>
      <PisteRail value={current} max={max} className="mt-1.5" />
    </li>
  );
}

/**
 * 4 kategori altında yetenekler (Profil ve Antrenman ortak kullanır). Ray yaş grubu ölçeğiyle dolar
 * (bands.ts); mutlak 0–100 değer satırda yazılı. Her kategoride en güçlü yetenek altın noktayla işaretli.
 */
export function SkillsByCategory({
  skills,
  locale,
  categoryId,
}: {
  skills: { key: string; label: string; category: string; current: number }[];
  locale: Locale;
  categoryId: string;
}) {
  const max = bandMax(categoryId);
  const group = ageGroup(categoryId);
  return (
    <div>
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {(Object.keys(CATEGORY_LABEL_TR) as SkillCategory[]).map((cat) => {
          const list = skills.filter((s) => s.category === cat);
          const avg = list.length ? list.reduce((a, s) => a + s.current, 0) / list.length : 0;
          const bestKey = list.length ? list.reduce((b, s) => (s.current > b.current ? s : b)).key : null;
          return (
            <div key={cat}>
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 font-display text-[17px] font-bold uppercase tracking-wide">
                  <Icon name={CATEGORY_ICON[cat]} size={18} className="text-steel" />
                  {t(locale, `category.${cat}`)}
                </h3>
                <span className="num text-[22px] leading-none">{avg.toFixed(1)}</span>
              </div>
              <ul className="space-y-3">
                {list.map((s) => (
                  <SkillBar key={s.key} label={s.label} current={s.current} max={max} best={s.key === bestKey} />
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-[13px] text-steel">{t(locale, "skills.bandNote", { group, max })}</p>
    </div>
  );
}

/**
 * Klasman — F1 sıralama kulesi tarzı. 1. sıra altın kenar (tek prestij rengi), 2–3 çelik kenar,
 * kendi satırın kırmızı kenar + SEN etiketi; listede aşağıdaysan ekranın altına yapışır (sticky).
 */
export function RankingTower({ rows, locale }: { rows: RankingRowDTO[]; locale: Locale }) {
  return (
    <div className="panel overflow-clip">
      <div className="grid grid-cols-[2.75rem_1fr_auto] border-b border-line px-3 py-2">
        <span className="kicker">#</span>
        <span className="kicker">{t(locale, "klasman.player")}</span>
        <span className="kicker">{t(locale, "klasman.points")}</span>
      </div>
      <ol>
        {rows.map((r) => {
          const edge = r.isHuman ? "bg-me" : r.position === 1 ? "bg-prio" : r.position <= 3 ? "bg-steel" : "";
          return (
            <li
              key={r.playerId}
              className={`relative grid min-h-12 grid-cols-[2.75rem_1fr_auto] items-center border-b border-line px-3 py-1.5 last:border-b-0 ${
                r.isHuman ? "sticky bottom-[calc(8rem+env(safe-area-inset-bottom))] z-10 bg-arena-2 lg:bottom-4" : ""
              }`}
            >
              {edge && <span className={`absolute inset-y-0 left-0 w-[3px] ${edge}`} aria-hidden="true" />}
              <span className="num text-[17px]">{r.position}</span>
              <span className="min-w-0">
                {/* Kendi adın "SEN" etiketi yerine kırmızı+kalın fontla ayırt edilir (satırdaki kırmızı kenarla uyumlu). */}
                <span className={`block truncate text-[15px] ${r.isHuman ? "font-semibold text-me" : ""}`}>{r.name}</span>
                {r.clubName && <span className="block truncate text-[13px] text-steel">{r.clubName}</span>}
              </span>
              <span className="num text-[15px]">{r.points.toFixed(1)}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
