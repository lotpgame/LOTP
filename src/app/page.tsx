import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createCareerAction } from "@/app/actions";
import { LangSelect } from "@/app/LangSelect";
import { GENDERS, PROFILES, TR_CITIES, WEAPONS } from "@/engine/domain";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { hasCareer } from "@/server/careerService";

// Veritabanı durumuna bağlı: her istekte taze render (statik önbelleğe alınmamalı).
export const dynamic = "force-dynamic";

export default async function Home() {
  if (await hasCareer()) redirect("/kariyer");
  const locale = await getLocale();

  return (
    <main className="mx-auto w-full max-w-lg px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Project Engarde</h1>
          <p className="mt-2 text-sm opacity-70">{t(locale, "create.tagline")}</p>
        </div>
        {/* Dil seçimi — açılır menü (kariyer oluşturmadan önce) */}
        <div className="shrink-0">
          <LangSelect current={locale} />
        </div>
      </div>

      <Link
        href="/giris"
        className="mt-4 block rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-3 py-2.5 text-center text-sm font-medium text-emerald-700 transition hover:bg-emerald-500/10 dark:text-emerald-300"
      >
        {t(locale, "giris.haveAccount")}
      </Link>

      <form action={createCareerAction} className="mt-8 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label={t(locale, "create.firstName")}>
            <input name="firstName" required maxLength={30} className={inputCls} />
          </Field>
          <Field label={t(locale, "create.lastName")}>
            <input name="lastName" required maxLength={30} className={inputCls} />
          </Field>
        </div>

        <Field label={t(locale, "create.gender")}>
          <select name="gender" required defaultValue="MALE" className={inputCls}>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {t(locale, `gender.${g}`)}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label={t(locale, "create.country")}>
            <select name="country" disabled defaultValue="TR" className={`${inputCls} opacity-70`}>
              <option value="TR">Türkiye</option>
            </select>
          </Field>
          <Field label={t(locale, "create.city")} hint={t(locale, "create.cityHint")}>
            <select name="city" required defaultValue="İstanbul" className={inputCls}>
              {TR_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Doğum tarihi alanı kaldırıldı — herkes 8 yaşında (U10) başlar, kariyerini yıllar içinde inşa eder. */}
        <Field label={t(locale, "create.weapon")}>
          <select name="weapon" required defaultValue="FOIL" className={inputCls}>
            {WEAPONS.map((w) => (
              <option key={w} value={w}>
                {t(locale, `weapon.${w}`)}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t(locale, "create.profile")} hint={t(locale, "create.profileHint")}>
          <select name="profile" required defaultValue="BALANCED" className={inputCls}>
            {PROFILES.map((p) => (
              <option key={p} value={p}>
                {t(locale, `profile.${p}`)}
              </option>
            ))}
          </select>
        </Field>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-500"
        >
          {t(locale, "create.start")}
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
