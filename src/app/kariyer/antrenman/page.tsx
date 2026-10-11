import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { SKILLS } from "@/engine/skill";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { Icon } from "@/app/ui/Icon";
import { CATEGORY_ICON, SkillsByCategory, Stat, conditionState, formState } from "../parts";
import { TrainingPlanForm } from "./TrainingPlanForm";

export const dynamic = "force-dynamic";

// Her antrenman türü + yorgunluk yükü anahtarı (motor: BASE_FATIGUE ile uyumlu).
const TRAIN_INFO: { cat: SkillCategory; fatigueKey: string }[] = [
  { cat: "TECHNICAL", fatigueKey: "fatigue.medium" },
  { cat: "PHYSICAL", fatigueKey: "fatigue.high" },
  { cat: "TACTICAL", fatigueKey: "fatigue.medium" },
  { cat: "MENTAL", fatigueKey: "fatigue.low" },
];

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  return (
    <main>
      <h1 className="display text-[28px]">{t(locale, "antrenman.title")}</h1>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat icon="calendar" label={t(locale, "antrenman.today")} value={c.dayName} word />
        <Stat icon="condition" label={t(locale, "profil.condition")} value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} traffic state={conditionState(locale, 100 - c.fatigue)} />
        <Stat icon="form" label={t(locale, "profil.form")} value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} traffic state={formState(locale, c.sharpness)} />
      </section>

      {c.injured && (
        <div className="panel mt-4 flex items-start gap-3 p-3">
          <Icon name="injury" size={22} className="shrink-0 text-sig-red" />
          <span className="text-[15px]">{t(locale, "antrenman.injured", { n: c.injuryDaysRemaining })}</span>
        </div>
      )}

      <section className="mt-6">
        <h2 className="display text-[22px]">{t(locale, "antrenman.weeklyPlan")}</h2>
        <p className="mt-1 text-[14px] text-steel">{t(locale, "antrenman.planIntro")}</p>
        <TrainingPlanForm initial={c.trainingPlan} locale={locale} />
        <p className="mt-3 text-[13px] text-steel">{t(locale, "antrenman.restNote")}</p>
      </section>

      {/* Hangi antrenman neyi geliştirir? — tıklayınca açılır */}
      <details className="panel group mt-6">
        <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
          <Icon name="info" size={18} className="shrink-0 text-steel" />
          <span className="flex-1">{t(locale, "antrenman.hint")}</span>
          <Icon name="chevron-down" size={18} className="shrink-0 text-steel transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid gap-2.5 px-4 pb-4 sm:grid-cols-2">
          {TRAIN_INFO.map((info) => {
            const skills = SKILLS.filter((s) => s.category === info.cat).map((s) => s.key);
            return (
              <div key={info.cat} className="rounded-md border border-line bg-arena-0 p-3">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Icon name={CATEGORY_ICON[info.cat]} size={18} className="text-steel" />
                  {t(locale, `category.${info.cat}`)}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {skills.map((k) => (
                    <span key={k} className="rounded-md border border-line px-2 py-0.5 text-[13px]">
                      {t(locale, `skill.${k}`)}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-[13px] text-steel">
                  {t(locale, `trainNote.${info.cat}`)} · {t(locale, "antrenman.fatigue")}: <b className="text-ink">{t(locale, info.fatigueKey)}</b>
                </p>
              </div>
            );
          })}
          <div className="rounded-md border border-line bg-arena-0 p-3">
            <div className="flex items-center gap-1.5 font-semibold">
              <Icon name="rest" size={18} className="text-steel" />
              {t(locale, "antrenman.restTitle")}
            </div>
            <p className="mt-1.5 text-[13px] text-steel">{t(locale, "antrenman.restDesc")}</p>
          </div>
        </div>
      </details>

      {/* Mevcut yeteneklerin — neyin eksik, profile dönmeden gör */}
      <section className="mt-6">
        <h2 className="display text-[22px]">{t(locale, "antrenman.currentSkills")}</h2>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "antrenman.currentSkillsNote")}</p>
        <div className="mt-3">
          <SkillsByCategory skills={c.skills} locale={locale} categoryId={c.categoryId} />
        </div>
      </section>
    </main>
  );
}
