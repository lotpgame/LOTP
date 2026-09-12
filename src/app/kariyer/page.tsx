import { redirect } from "next/navigation";
import { resetCareerAction, runTournamentAction, trainAction } from "@/app/actions";
import {
  GENDER_LABEL_TR,
  WEAPON_LABEL_TR,
  type Gender,
  type SkillCategory,
  type Weapon,
} from "@/engine/domain";
import { TRAINING_LABEL_TR, TRAINING_TYPES } from "@/engine/training";
import { getCareer, type CareerDTO } from "@/server/careerService";

// Veritabanı durumuna bağlı: her istekte taze render.
export const dynamic = "force-dynamic";

const CATEGORY_LABEL_TR: Record<SkillCategory, string> = {
  TECHNICAL: "Teknik",
  PHYSICAL: "Fiziksel",
  MENTAL: "Mental",
  TACTICAL: "Taktik",
};

export default async function KariyerPage() {
  const c = await getCareer();
  if (!c) redirect("/");

  const date = new Date(c.currentDate).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{c.name}</h1>
          <p className="text-sm opacity-70">
            {c.code} · {GENDER_LABEL_TR[c.gender as Gender]} ·{" "}
            {WEAPON_LABEL_TR[c.weapon as Weapon]} · {c.age} yaş · {c.categoryId}
          </p>
        </div>
        <form action={resetCareerAction}>
          <button className="rounded-md border border-black/15 px-3 py-1.5 text-xs opacity-70 transition hover:opacity-100 dark:border-white/20">
            Yeni Kariyer
          </button>
        </form>
      </header>

      {/* Durum özeti */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sezon" value={`Q${c.quarter} · Hafta ${c.week}/12`} />
        <Stat label="Genel" value={c.overall.toFixed(1)} />
        <Stat label="Yorgunluk" value={`${c.fatigue.toFixed(0)} / 100`} />
        <Stat
          label="Milli Takım"
          value={c.nationalTeam ? "✔ Kadroda" : "—"}
        />
      </section>
      <p className="mt-2 text-xs opacity-50">{date}</p>

      {/* Antrenman */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Haftalık Antrenman</h2>
        <p className="text-sm opacity-70">
          Bir çalışma seç — hafta ilerler, ilgili skill&apos;ler gelişir, yorgunluk değişir.
        </p>
        <form action={trainAction} className="mt-3 flex flex-wrap gap-2">
          {TRAINING_TYPES.map((t) => (
            <button
              key={t}
              name="type"
              value={t}
              className="rounded-lg border border-black/15 px-3 py-2 text-sm transition hover:border-emerald-500 hover:text-emerald-600 dark:border-white/20"
            >
              {TRAINING_LABEL_TR[t]}
            </button>
          ))}
        </form>
      </section>

      {/* Skill'ler */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Yetenekler</h2>
        <div className="mt-3 grid gap-6 sm:grid-cols-2">
          {(Object.keys(CATEGORY_LABEL_TR) as SkillCategory[]).map((cat) => (
            <div key={cat}>
              <h3 className="mb-2 text-sm font-medium opacity-80">{CATEGORY_LABEL_TR[cat]}</h3>
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

      {/* Bu haftanın turnuvaları */}
      <section className="mt-8 rounded-xl border border-black/10 p-4 dark:border-white/15">
        <h2 className="text-lg font-semibold">Bu Hafta — Turnuvalar</h2>
        <p className="text-sm opacity-70">
          Havuz → FIE sıralaması → eleme. Uluslararası organizasyonlar Quarter Ranking&apos;e göre
          davetlidir. Katılınca hafta ilerler.
        </p>
        <form action={runTournamentAction} className="mt-3 flex flex-col gap-2">
          {c.weekEvents.map((e) =>
            e.qualified ? (
              <button
                key={e.level}
                name="level"
                value={e.level}
                className="flex items-center justify-between rounded-lg bg-emerald-600 px-4 py-2.5 text-left text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                <span>{e.label}</span>
                <span className="text-xs opacity-80">Katıl →</span>
              </button>
            ) : (
              <div
                key={e.level}
                className="flex items-center justify-between rounded-lg border border-black/10 px-4 py-2.5 text-sm opacity-60 dark:border-white/15"
              >
                <span>{e.label}</span>
                <span className="text-xs">🔒 {e.requirement}</span>
              </div>
            ),
          )}
        </form>
      </section>

      {/* Quarter Ranking */}
      <RankingTable ranking={c.ranking} quarter={c.quarter} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15">
      <div className="text-xs opacity-60">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}

function SkillBar({ label, current, potential }: { label: string; current: number; potential: number }) {
  return (
    <li>
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums opacity-70">
          {current.toFixed(1)}
          <span className="opacity-50"> / {potential.toFixed(0)}</span>
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${current}%` }} />
      </div>
    </li>
  );
}

function RankingTable({ ranking, quarter }: { ranking: CareerDTO["ranking"]; quarter: number }) {
  if (ranking.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-semibold">Quarter Ranking (Q{quarter})</h2>
        <p className="mt-1 text-sm opacity-60">
          Bu quarter henüz turnuva oynanmadı. İlk turnuvadan sonra sıralama oluşur (quarter
          sonunda sıfırlanır).
        </p>
      </section>
    );
  }
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold">Quarter Ranking (Q{quarter})</h2>
      <ol className="mt-3 divide-y divide-black/10 overflow-hidden rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/15">
        {ranking.map((r) => (
          <li
            key={r.playerId}
            className={`flex items-center justify-between px-3 py-2 text-sm ${
              r.isHuman ? "bg-emerald-500/10 font-medium" : ""
            }`}
          >
            <span>
              <span className="inline-block w-6 tabular-nums opacity-60">{r.position}.</span>
              {r.name}
              {r.isHuman ? " (sen)" : ""}
            </span>
            <span className="tabular-nums opacity-70">{r.points.toFixed(1)} p</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
