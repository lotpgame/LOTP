import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { SkillsByCategory, Stat, StatBar } from "./parts";

export const dynamic = "force-dynamic";

/** Küçük tam sayıyı Roma rakamına çevirir (sezon göstergesi: I, II, III…). */
function toRoman(n: number): string {
  if (n <= 0) return String(n);
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
  return out;
}

export default async function ProfilPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  return (
    <main>
      {/* Kimlik afişi üstteki başlıkta (CareerNav); burada tekrar edilmez. */}
      {/* Durum özeti — Kondisyon = 100−yorgunluk (dolu başlar, antrenmanla azalır). */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="📅" label={t(locale, "profil.season")} value={toRoman(c.seasonNo)} />
        <Stat icon="⭐" label={t(locale, "profil.overall")} value={c.overall.toFixed(1)} />
        <Stat icon="🔋" label={t(locale, "profil.condition")} value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat icon="🎯" label={t(locale, "profil.form")} value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>
      <p className="mt-2 text-xs opacity-50">
        📅 {c.dateLabel} · ✨ {c.experience} tecrübe
      </p>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          {t(locale, "profil.injured", { n: c.injuryDaysRemaining })}
        </div>
      )}

      {/* Fizik + Psikoloji */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">📏 {t(locale, "profil.physique")}</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>{t(locale, "profil.height")}</span><span className="tabular-nums opacity-70">{c.physique.heightCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.reach")}</span><span className="tabular-nums opacity-70">{c.physique.reachCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.leg")}</span><span className="tabular-nums opacity-70">{c.physique.legLengthCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.weight")}</span><span className="tabular-nums opacity-70">{c.physique.weightKg.toFixed(0)} kg</span></li>
            <li className="flex justify-between"><span>{t(locale, "profil.hand")}</span><span className="opacity-70">{c.physique.leftHanded ? t(locale, "profil.left") : t(locale, "profil.right")}</span></li>
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">🧠 {t(locale, "profil.psychology")}</h3>
          <div className="space-y-2">
            <StatBar label={t(locale, "profil.morale")} value={c.psychology.morale} />
            <StatBar label={t(locale, "profil.motivation")} value={c.psychology.motivation} />
            <StatBar label={t(locale, "profil.confidence")} value={c.psychology.confidence} />
            <StatBar label={t(locale, "profil.stress")} value={c.psychology.stress} tone="warn" />
          </div>
          {c.traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.traits.map((tr) => (
                <span key={tr} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {t(locale, `trait.${tr}`)}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Yetenekler */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">🤺 {t(locale, "profil.skills")}</h2>
        <div className="mt-3">
          <SkillsByCategory skills={c.skills} locale={locale} />
        </div>
      </section>
    </main>
  );
}
