import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createCareerAction } from "@/app/actions";
import {
  GENDER_LABEL_TR,
  GENDERS,
  PROFILE_LABEL_TR,
  PROFILES,
  WEAPON_LABEL_TR,
  WEAPONS,
} from "@/engine/domain";
import { hasCareer } from "@/server/careerService";

// Veritabanı durumuna bağlı: her istekte taze render (statik önbelleğe alınmamalı).
export const dynamic = "force-dynamic";

export default async function Home() {
  if (await hasCareer()) redirect("/kariyer");

  return (
    <main className="mx-auto w-full max-w-lg px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight">Project Engarde</h1>
      <p className="mt-2 text-sm opacity-70">
        Eskrim kariyeri simülasyonu. Bir eskrimci yarat ve kariyerini yönet.
      </p>

      <form action={createCareerAction} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ad">
            <input name="firstName" required maxLength={30} className={inputCls} />
          </Field>
          <Field label="Soyad">
            <input name="lastName" required maxLength={30} className={inputCls} />
          </Field>
        </div>

        <Field label="Cinsiyet">
          <select name="gender" required defaultValue="MALE" className={inputCls}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {GENDER_LABEL_TR[g]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Doğum Tarihi" hint="Yaş kategorisi (U10…Senior) doğum tarihinden otomatik belirlenir. Oyun 2026'da başlar; varsayılan 8 yaş (erken kariyer).">
          <input type="date" name="birthDate" required max="2018-01-01" defaultValue="2018-01-01" className={inputCls} />
        </Field>

        <Field label="Silah">
          <select name="weapon" required defaultValue="FOIL" className={inputCls}>
            {WEAPONS.map((w) => (
              <option key={w} value={w}>
                {WEAPON_LABEL_TR[w]}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Başlangıç Profili" hint="Başlangıç yönelimi; kariyeri belirlemez, gelişimle değişir.">
          <select name="profile" required defaultValue="BALANCED" className={inputCls}>
            {PROFILES.map((p) => (
              <option key={p} value={p}>
                {PROFILE_LABEL_TR[p]}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
        >
          Kariyere Başla
        </button>
      </form>
    </main>
  );
}

const inputCls =
  "w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 outline-none focus:border-emerald-500 dark:border-white/20";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs opacity-60">{hint}</span> : null}
    </label>
  );
}
