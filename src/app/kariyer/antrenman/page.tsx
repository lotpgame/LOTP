import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { SKILLS } from "@/engine/skill";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { CATEGORY_ICON, SkillsByCategory, Stat } from "../parts";
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
      <h1 className="text-xl font-bold">{t(locale, "antrenman.title")}</h1>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat icon="📅" label={t(locale, "antrenman.today")} value={c.dayName} />
        <Stat icon="🔋" label={t(locale, "profil.condition")} value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat icon="🎯" label={t(locale, "profil.form")} value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {t(locale, "antrenman.injured", { n: c.injuryDaysRemaining })}
        </div>
      )}

      <section className="mt-5">
        <h2 className="text-lg font-semibold">{t(locale, "antrenman.weeklyPlan")}</h2>
        <p className="mt-1 text-sm opacity-70">{t(locale, "antrenman.planIntro")}</p>
        <TrainingPlanForm initial={c.trainingPlan} locale={locale} />
        <p className="mt-2 text-xs opacity-50">{t(locale, "antrenman.restNote")}</p>
      </section>

      {/* Hangi antrenman neyi geliştirir? — hint (tıklayınca açılır) */}
      <details className="mt-6 rounded-xl border border-black/10 dark:border-white/15">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
          {t(locale, "antrenman.hint")} <span className="opacity-50">{t(locale, "antrenman.open")}</span>
        </summary>
        <div className="grid gap-2.5 px-4 pb-4 sm:grid-cols-2">
          {TRAIN_INFO.map((info) => {
            const skills = SKILLS.filter((s) => s.category === info.cat).map((s) => s.key);
            return (
              <div key={info.cat} className="rounded-xl border border-black/10 bg-black/[0.015] p-3 dark:border-white/15 dark:bg-white/[0.02]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>{CATEGORY_ICON[info.cat]}</span>
                  {t(locale, `category.${info.cat}`)}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {skills.map((k) => (
                    <span key={k} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                      {t(locale, `skill.${k}`)}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-xs opacity-60">
                  {t(locale, `trainNote.${info.cat}`)} · {t(locale, "antrenman.fatigue")}: <b>{t(locale, info.fatigueKey)}</b>
                </p>
              </div>
            );
          })}
          <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
            <div className="font-medium">{t(locale, "antrenman.restTitle")}</div>
            <p className="mt-1.5 text-xs opacity-70">{t(locale, "antrenman.restDesc")}</p>
          </div>
        </div>
      </details>

      {/* Mevcut yeteneklerin — neyin eksik, profile dönmeden gör */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">{t(locale, "antrenman.currentSkills")}</h2>
        <p className="mt-1 text-xs opacity-60">{t(locale, "antrenman.currentSkillsNote")}</p>
        <div className="mt-3">
          <SkillsByCategory skills={c.skills} locale={locale} />
        </div>
      </section>
    </main>
  );
}
