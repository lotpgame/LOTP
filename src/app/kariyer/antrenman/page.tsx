import { redirect } from "next/navigation";
import { type SkillCategory } from "@/engine/domain";
import { SKILLS } from "@/engine/skill";
import { getCareer } from "@/server/careerService";
import { CATEGORY_ICON, CATEGORY_LABEL_TR, SkillsByCategory, Stat } from "../parts";
import { TrainingPlanForm } from "./TrainingPlanForm";

export const dynamic = "force-dynamic";

// Her antrenman türü hangi skill'leri geliştirir + yorgunluk yükü (motor: BASE_FATIGUE ile uyumlu).
const TRAIN_INFO: { cat: SkillCategory; fatigue: string; note: string }[] = [
  { cat: "TECHNICAL", fatigue: "orta", note: "silah tekniği ve ayak çalışması" },
  { cat: "PHYSICAL", fatigue: "yüksek", note: "hız, dayanıklılık, refleks — en çok yorar" },
  { cat: "TACTICAL", fatigue: "orta", note: "rakip okuma ve doğru anı yakalama" },
  { cat: "MENTAL", fatigue: "düşük", note: "odak ve baskı altında sakinlik — az yorar" },
];

export default async function AntrenmanPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  return (
    <main>
      <h1 className="text-xl font-bold">Antrenman</h1>

      <section className="mt-3 grid grid-cols-3 gap-2.5">
        <Stat label="Bugün" value={c.dayName} />
        <Stat label="Kondisyon" value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat label="Form" value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          🩹 Sakatsın — {c.injuryDaysRemaining} gün pistlerden uzaksın. Alttaki <b>İlerle</b> ile
          iyileşene kadar dinlenirsin (antrenman/turnuva yok).
        </div>
      )}

      <section className="mt-5">
        <h2 className="text-lg font-semibold">Haftalık Plan</h2>
        <p className="mt-1 text-sm opacity-70">
          Program her ay tekrar eder: Salı İl, Perşembe Türkiye, Cumartesi Open turnuvaları;
          <b> Pazartesi/Çarşamba/Cuma/Pazar antrenman</b>. Bu 4 antrenman gününde ne çalışacağını
          seç ve kaydet — alttaki <b>İlerle</b> planı uygular, turnuva gününde durur.
        </p>
        <TrainingPlanForm initial={c.trainingPlan} />
        <p className="mt-2 text-xs opacity-50">
          Dinlenme yorgunluğu düşürür ama formu azaltır; çok yüklenme sakatlık riskini artırır.
        </p>
      </section>

      {/* Hangi antrenman neyi geliştirir? — hint (tıklayınca açılır) */}
      <details className="mt-6 rounded-xl border border-black/10 dark:border-white/15">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium transition hover:bg-black/[0.03] dark:hover:bg-white/[0.04]">
          ❓ Hangi antrenman neyi geliştirir? <span className="opacity-50">(aç)</span>
        </summary>
        <div className="grid gap-2.5 px-4 pb-4 sm:grid-cols-2">
          {TRAIN_INFO.map((info) => {
            const skills = SKILLS.filter((s) => s.category === info.cat).map((s) => s.label);
            return (
              <div key={info.cat} className="rounded-xl border border-black/10 bg-black/[0.015] p-3 dark:border-white/15 dark:bg-white/[0.02]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span>{CATEGORY_ICON[info.cat]}</span>
                  {CATEGORY_LABEL_TR[info.cat]}
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {skills.map((s) => (
                    <span key={s} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                      {s}
                    </span>
                  ))}
                </div>
                <p className="mt-1.5 text-xs opacity-60">
                  {info.note} · yorgunluk: <b>{info.fatigue}</b>
                </p>
              </div>
            );
          })}
          <div className="rounded-xl border border-sky-500/25 bg-sky-500/[0.06] p-3">
            <div className="font-medium">😴 Dinlenme</div>
            <p className="mt-1.5 text-xs opacity-70">
              Kondisyonu toparlar (yorgunluğu düşürür) ama o gün form biraz azalır. Yorgunken
              antrenman verimi de düşer — ara ara dinlenmek gelişimi hızlandırır.
            </p>
          </div>
        </div>
      </details>

      {/* Mevcut yeteneklerin — neyin eksik, profile dönmeden gör */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">🤺 Mevcut Yeteneklerin</h2>
        <p className="mt-1 text-xs opacity-60">Hangi alanı geliştirmen gerektiğini burada görüp planını ona göre kur.</p>
        <div className="mt-3">
          <SkillsByCategory skills={c.skills} />
        </div>
      </section>
    </main>
  );
}
