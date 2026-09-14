import { redirect } from "next/navigation";
import { type Weapon } from "@/engine/domain";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { SkillsByCategory, Stat, StatBar, initials } from "./parts";

export const dynamic = "force-dynamic";

const WEAPON_EMOJI: Record<Weapon, string> = { FOIL: "🤺", EPEE: "⚔️", SABRE: "🗡️" };

export default async function ProfilPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();

  const date = new Date(c.currentDate).toLocaleDateString(locale === "en" ? "en-GB" : "tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ageCat = c.categoryId.split("-")[0]; // "U17-M-FL" → "U17"
  const weaponLabel = t(locale, `weapon.${c.weapon}`);
  const genderLabel = t(locale, `gender.${c.gender}`);

  return (
    <main>
      {/* Kimlik afişi — avatar + isim + kategori rozeti (görsel çekicilik). */}
      <section className="overflow-hidden rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-transparent p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/30 sm:h-20 sm:w-20 sm:text-3xl">
            {initials(c.name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{c.name}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <span className="rounded-full bg-black/10 px-2 py-0.5 font-medium dark:bg-white/15">
                {WEAPON_EMOJI[c.weapon as Weapon]} {weaponLabel}
              </span>
              <span className="rounded-full bg-black/10 px-2 py-0.5 font-medium dark:bg-white/15">{genderLabel}</span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                {ageCat} · {c.age} {t(locale, "common.age")}
              </span>
              {c.club && (
                <span className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/15">🏛 {c.club.city}</span>
              )}
              {c.nationalTeam && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-semibold text-red-700 dark:text-red-300">
                  🇹🇷 {t(locale, "common.nationalTeam")}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Durum özeti — Kondisyon = 100−yorgunluk (dolu başlar, antrenmanla azalır). */}
      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="📅" label={t(locale, "profil.season")} value={`Q${c.quarter} / H${c.month}`} />
        <Stat icon="⭐" label={t(locale, "profil.overall")} value={c.overall.toFixed(1)} />
        <Stat icon="🔋" label={t(locale, "profil.condition")} value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat icon="🎯" label={t(locale, "profil.form")} value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>
      <p className="mt-2 text-xs opacity-50">{c.dayName} · {date}</p>

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
