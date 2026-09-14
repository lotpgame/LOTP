import { redirect } from "next/navigation";
import {
  type SkillCategory,
  type Weapon,
  type Gender,
  WEAPON_LABEL_TR,
  GENDER_LABEL_TR,
} from "@/engine/domain";
import { getCareer } from "@/server/careerService";
import { CATEGORY_ICON, CATEGORY_LABEL_TR, SkillBar, Stat, StatBar, initials } from "./parts";

export const dynamic = "force-dynamic";

const WEAPON_EMOJI: Record<Weapon, string> = { FOIL: "🤺", EPEE: "⚔️", SABRE: "🗡️" };

export default async function ProfilPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const date = new Date(c.currentDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const ageCat = c.categoryId.split("-")[0]; // "U17-M-FL" → "U17"
  const weaponLabel = WEAPON_LABEL_TR[c.weapon as Weapon] ?? c.weapon;
  const genderLabel = GENDER_LABEL_TR[c.gender as Gender] ?? c.gender;

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
                {ageCat} · {c.age} yaş
              </span>
              {c.club && (
                <span className="rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/15">🏛 {c.club.city}</span>
              )}
              {c.nationalTeam && (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 font-semibold text-red-700 dark:text-red-300">
                  🇹🇷 Milli Takım
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Durum özeti — Kondisyon = 100−yorgunluk (dolu başlar, antrenmanla azalır). */}
      <section className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Stat icon="📅" label="Sezon" value={`Q${c.quarter} / H${c.month}`} />
        <Stat icon="⭐" label="Genel Güç" value={c.overall.toFixed(1)} />
        <Stat icon="🔋" label="Kondisyon" value={`%${(100 - c.fatigue).toFixed(0)}`} gauge={100 - c.fatigue} />
        <Stat icon="🎯" label="Keskinlik" value={`%${c.sharpness.toFixed(0)}`} gauge={c.sharpness} />
      </section>
      <p className="mt-2 text-xs opacity-50">{c.dayName} · {date}</p>

      {c.injured && (
        <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          🩹 Sakatsın — {c.injuryDaysRemaining} gün pistlerden uzaksın. (Alttaki İlerle ile iyileşirsin.)
        </div>
      )}

      {/* Fizik + Psikoloji */}
      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">📏 Fizik</h3>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between"><span>Boy</span><span className="tabular-nums opacity-70">{c.physique.heightCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Kulaç (erişim)</span><span className="tabular-nums opacity-70">{c.physique.reachCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Bacak</span><span className="tabular-nums opacity-70">{c.physique.legLengthCm.toFixed(0)} cm</span></li>
            <li className="flex justify-between"><span>Kilo</span><span className="tabular-nums opacity-70">{c.physique.weightKg.toFixed(0)} kg</span></li>
            <li className="flex justify-between"><span>El</span><span className="opacity-70">{c.physique.leftHanded ? "Sol" : "Sağ"}</span></li>
          </ul>
        </div>

        <div className="rounded-xl border border-black/10 p-4 dark:border-white/15">
          <h3 className="mb-3 text-sm font-semibold opacity-80">🧠 Psikoloji</h3>
          <div className="space-y-2">
            <StatBar label="Moral" value={c.psychology.morale} />
            <StatBar label="Motivasyon" value={c.psychology.motivation} />
            <StatBar label="Özgüven" value={c.psychology.confidence} />
            <StatBar label="Stres" value={c.psychology.stress} tone="warn" />
          </div>
          {c.traits.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {c.traits.map((t) => (
                <span key={t} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Yetenekler */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">🤺 Yetenekler</h2>
        <p className="mt-1 text-xs opacity-60">
          Değerler 0–100. İkinci sayı (<b>tavan</b>) bu oyuncunun gizli yetenek sınırı — antrenmanla en
          fazla oraya gelişir; herkes 100 olamaz. Çubuktaki çizgi tavanı gösterir.
        </p>
        <div className="mt-3 grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {(Object.keys(CATEGORY_LABEL_TR) as SkillCategory[]).map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-medium opacity-80">
                {CATEGORY_ICON[cat]} {CATEGORY_LABEL_TR[cat]}
              </h3>
              <ul className="space-y-2">
                {c.skills
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <SkillBar key={s.key} label={s.label} current={s.current} potential={s.potential} />
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
