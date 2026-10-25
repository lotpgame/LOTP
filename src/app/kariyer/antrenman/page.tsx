import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { SKILLS } from "@/engine/skill";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { CATEGORY_ICON, SkillsByCategory } from "../parts";
import { InfoNote } from "../InfoNote";
import { CollapsibleSection } from "../CollapsibleSection";
import { TrainingPlanForm } from "./TrainingPlanForm";

export const dynamic = "force-dynamic";

// Her antrenman türü + yorgunluk yükü + İMZA RENGİ (gençlere göre canlı, oyun-gibi renk-kod).
// Renkler hem açık hem koyu temada okunur (orta-parlak tonlar).
const TRAIN_INFO: { cat: SkillCategory; fatigueKey: string; color: string }[] = [
  { cat: "TECHNICAL", fatigueKey: "fatigue.medium", color: "#3b82f6" }, // mavi
  { cat: "PHYSICAL", fatigueKey: "fatigue.high", color: "#ef4444" }, // kırmızı
  { cat: "TACTICAL", fatigueKey: "fatigue.medium", color: "#22c55e" }, // yeşil
  { cat: "MENTAL", fatigueKey: "fatigue.low", color: "#a855f7" }, // mor
];

/** Hero'daki büyük enerji barı (Kondisyon/Form) — koyu konsol bandında parlak dolum. */
function EnergyBar({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-console-steel">{label}</span>
        <span className="num text-[16px] leading-none text-console-ink">%{v.toFixed(0)}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-console-line">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 8px ${color}55` }}
        />
      </div>
    </div>
  );
}

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const condition = 100 - c.fatigue;

  return (
    <main className="relative flex flex-col gap-5">
      {/* ——— TÜM SAYFA ARKA PLANI: eskrim salonu (Champ Manager tarzı), sabit; içerik üstünde ——— */}
      <div aria-hidden="true" className="fixed inset-0 -z-10">
        <img src="/img/salle-antrenman.webp" alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/72" />
      </div>

      {/* ——— HERO: Kondisyon/Form — ince/kompakt kutu (sayfa arka planı salonun kendisi) ——— */}
      <section data-scope="console" className="relative overflow-hidden rounded-xl bg-black/35 px-4 py-3 ring-1 ring-white/10">
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="kicker text-console-steel">{t(locale, "antrenman.title")}</span>
            <span className="flex items-center gap-1.5 text-console-ink">
              <Icon name="calendar" size={14} className="text-console-steel" />
              <span className="font-display text-[15px] font-bold leading-none">{c.dayName}</span>
            </span>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-4">
            <EnergyBar label={t(locale, "profil.condition")} value={condition} color="#22c55e" />
            <EnergyBar label={t(locale, "profil.form")} value={c.sharpness} color="#e0b23f" />
          </div>
        </div>
      </section>

      {c.injured && (
        <div className="panel flex items-start gap-3 border-l-4 border-l-sig-red p-3">
          <Icon name="injury" size={22} className="shrink-0 text-sig-red" />
          <span className="text-[15px]">{t(locale, "antrenman.injured", { n: c.injuryDaysRemaining })}</span>
        </div>
      )}

      {/* ——— Haftalık plan (varsayılan AÇIK — ana iş) ——— */}
      <CollapsibleSection title={t(locale, "antrenman.weeklyPlan")} defaultOpen>
        {/* Uzun açıklama açılır-kapanır (kapalı) → ekran sade. restNote'u TrainingPlanForm zaten gösteriyor. */}
        <InfoNote locale={locale}>
          <p>{t(locale, "antrenman.planIntro")}</p>
        </InfoNote>
        <TrainingPlanForm initial={c.trainingPlan} locale={locale} />
      </CollapsibleSection>

      {/* ——— Antrenman türleri: renk-kodlu kartlar (ne geliştirir) — varsayılan KAPALI ——— */}
      <CollapsibleSection title={t(locale, "antrenman.hint")}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {TRAIN_INFO.map((info) => {
            const skills = SKILLS.filter((s) => s.category === info.cat).map((s) => s.key);
            return (
              <div
                key={info.cat}
                className="panel overflow-hidden p-3 pl-4"
                style={{ borderLeft: `4px solid ${info.color}` }}
              >
                <div className="flex items-center gap-2 font-display text-[17px] font-bold">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${info.color}1f`, color: info.color }}
                  >
                    <Icon name={CATEGORY_ICON[info.cat]} size={20} />
                  </span>
                  {t(locale, `category.${info.cat}`)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {skills.map((k) => (
                    <span key={k} className="rounded-md border border-line bg-arena-0 px-2 py-0.5 text-[13px]">
                      {t(locale, `skill.${k}`)}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-steel">
                  {t(locale, `trainNote.${info.cat}`)} · {t(locale, "antrenman.fatigue")}:{" "}
                  <b className="text-ink">{t(locale, info.fatigueKey)}</b>
                </p>
              </div>
            );
          })}
          {/* Dinlenme kartı (nötr) */}
          <div className="panel p-3 pl-4" style={{ borderLeft: "4px solid var(--steel)" }}>
            <div className="flex items-center gap-2 font-display text-[17px] font-bold">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-arena-2 text-steel">
                <Icon name="rest" size={20} />
              </span>
              {t(locale, "antrenman.restTitle")}
            </div>
            <p className="mt-2 text-[13px] text-steel">{t(locale, "antrenman.restDesc")}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* ——— Mevcut yeteneklerin — varsayılan KAPALI ——— */}
      <CollapsibleSection title={t(locale, "antrenman.currentSkills")}>
        <p className="text-[13px] text-steel">{t(locale, "antrenman.currentSkillsNote")}</p>
        <div className="mt-3">
          <SkillsByCategory skills={c.skills} locale={locale} categoryId={c.categoryId} />
        </div>
      </CollapsibleSection>
    </main>
  );
}
