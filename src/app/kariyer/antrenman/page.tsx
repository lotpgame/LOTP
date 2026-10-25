import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { SKILLS } from "@/engine/skill";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { CATEGORY_ICON, SkillsByCategory, conditionState, formState } from "../parts";
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
        <span className="text-[12px] font-medium uppercase tracking-wide text-console-steel">{label}</span>
        <span className="num text-[22px] leading-none text-console-ink">%{v.toFixed(0)}</span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-console-line">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${v}%`, background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 10px ${color}66` }}
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
    <main className="flex flex-col gap-5">
      {/* ——— HERO: "Antrenman Salonu" konsolu — enerjik, gençlere göre ——— */}
      <section data-scope="console" className="mesh relative overflow-hidden rounded-xl p-5">
        {/* Dev ikon filigranı */}
        <Icon name="train" size={150} className="pointer-events-none absolute -right-6 -top-6 text-console-ink opacity-[0.06]" />
        <div className="relative">
          <span className="kicker text-console-steel">{t(locale, "antrenman.title")}</span>
          <div className="mt-1.5 flex items-center gap-2 text-console-ink">
            <Icon name="calendar" size={18} className="text-console-steel" />
            <span className="font-display text-[20px] font-bold leading-none">{c.dayName}</span>
          </div>
          {/* Kondisyon + Form: büyük enerji barları (antrenmana hazırlık durumu) */}
          <div className="mt-4 grid grid-cols-2 gap-4">
            <EnergyBar label={t(locale, "profil.condition")} value={condition} color="#22c55e" />
            <EnergyBar label={t(locale, "profil.form")} value={c.sharpness} color="#e0b23f" />
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-console-steel">
            <span>{conditionState(locale, condition)}</span>
            <span aria-hidden="true">·</span>
            <span>{formState(locale, c.sharpness)}</span>
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
