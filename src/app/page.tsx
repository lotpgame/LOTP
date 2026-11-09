import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createCareerAction } from "@/app/actions";
import { LangSelect } from "@/app/LangSelect";
import { GENDERS, PROFILES, WEAPONS } from "@/engine/domain";
import { COUNTRIES, countryFlag } from "@/engine/geo";
import { CountryCitySelect } from "@/app/CountryCitySelect";
import { t, type Locale } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { currentUser, hasCareer } from "@/server/careerService";
import { GoogleSignIn } from "@/app/GoogleSignIn";
import { InstallPrompt } from "@/app/InstallPrompt";
import { Icon, weaponIcon } from "@/app/ui/Icon";
import { PisteLine } from "@/app/ui/Piste";
import { ScoreBug } from "@/app/ui/ScoreBug";

// Veritabanı durumuna bağlı: her istekte taze render (statik önbelleğe alınmamalı).
export const dynamic = "force-dynamic";

// Giriş ekranı 3 adımı → oyundaki menü logolarıyla (antrenman / turnuvalar / klasman) — kullanıcı 09.11.
const STEPS: { img: string; key: string }[] = [
  { img: "/img/menu/antrenman.webp", key: "landing.step1" },
  { img: "/img/menu/turnuvalar.webp", key: "landing.step2" },
  { img: "/img/menu/klasman.webp", key: "landing.step3" },
];

/**
 * Giriş ekranı — davet linkiyle telefondan gelen yeni oyuncunun ilk gördüğü sayfa.
 * Önce oyunu göster (koyu vitrin + örnek skor bandı + maç anlatımı), sonra 3 adım, sonra form.
 * Masaüstünde (lg) iki sütun: solda vitrin + 3 adım sabit durur, sağda form kayar.
 * Vitrindeki isimler ve skor örnektir (gerçek sporcu değil); veri okumaz, yazmaz.
 */
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ auth?: string }>;
}) {
  const user = await currentUser();
  const signedIn = !!user?.email; // Google ile giriş yapılmış mı
  if (signedIn && (await hasCareer())) redirect("/kariyer");
  const locale = await getLocale();
  // Google dönüşünde hata/çözülmemiş yapılandırma → sessiz kalmasın, kullanıcının dilinde uyar.
  const { auth } = await searchParams;
  const authMsg = auth === "error" ? "auth.error" : auth === "unconfigured" ? "auth.unconfigured" : null;
  // IP'den ülke (Vercel `x-vercel-ip-country` — ücretsiz, dış servis yok). Desteklediğimiz 18 ülkeden
  // biriyse formu ona ön-seçeriz (akıllı varsayılan; oyuncu değiştirebilir). Yoksa/yerelde → TR.
  const ipCountry = (await headers()).get("x-vercel-ip-country")?.toUpperCase() ?? "";
  const defaultCountry = COUNTRIES.some((c) => c.code === ipCountry) ? ipCountry : "TR";
  // Ülke seçenekleri: çevrilmiş ad + bayrak + o ülkenin alfabetik şehirleri; liste ada göre alfabetik.
  const countryOptions = COUNTRIES.map((c) => ({
    code: c.code,
    name: t(locale, `country.${c.code}`),
    flag: countryFlag(c.code),
    cities: [...c.cities].sort((a, b) => a.localeCompare(b, locale)),
  })).sort((a, b) => a.name.localeCompare(b.name, locale));

  return (
    <main className="lg:grid lg:grid-cols-2">
      {/* ——— Vitrin (her zaman koyu) ——— */}
      <section data-scope="console" className="mesh relative lg:sticky lg:top-0 lg:h-svh lg:self-start">
        <div className="mx-auto flex min-h-[58svh] w-full max-w-lg flex-col px-4 pt-5 pb-6 sm:px-6 lg:h-full lg:min-h-0 lg:max-w-xl lg:justify-center-safe lg:overflow-y-auto lg:px-12 lg:py-10 lg:*:shrink-0">
          <div className="flex items-start justify-between gap-3">
            <span className="kicker">{t(locale, "landing.kicker")}</span>
            <LangSelect current={locale} />
          </div>
          {/* Marka logosu — hero. Saydam amblem (kare zemin yok → sayfaya oturur), ortalı. Logoda yazı zaten
              var; başlık metni ekran okuyucu için saklı (erişilebilirlik + SEO). */}
          <img
            src="/img/logo-mark.png"
            alt="Legends of the Piste"
            width={560}
            height={560}
            className="mt-1 w-60 self-center lg:w-72"
          />
          <h1 lang="en" className="sr-only">Legends of the Piste</h1>
          <p className="mt-3 text-[15px] text-console-steel lg:text-[17px]">{t(locale, "landing.lead")}</p>

          <ScoreBug
            className="mt-5 border border-console-line"
            left={t(locale, "landing.demoA")}
            right={t(locale, "landing.demoB")}
            scoreL={4}
            scoreR={3}
            flash="left"
          />
          {/* Örnek anlatım — sabit yükseklik, hareketsiz (sayfa kaymaz) */}
          <ol className="mt-3 flex min-h-[7.5rem] flex-col gap-1.5 text-[14px]">
            {[1, 2, 3].map((n) => (
              <li key={n} className="border-l-2 border-console-line pl-2.5 text-console-steel">
                {t(locale, `landing.demo${n}`)}
              </li>
            ))}
            <li className="border-l-2 border-sig-red pl-2.5 font-medium">{t(locale, "landing.demo4")}</li>
          </ol>

          <Steps locale={locale} className="mt-8 hidden lg:grid" />

          {/* Masaüstünde form zaten yanda görünür → atlama butonu yalnız telefonda */}
          <a href="#olustur" className="btn-ink press mt-auto h-12 w-full text-[16px] lg:hidden">
            {t(locale, "landing.cta")}
            <Icon name="chevron-down" size={18} />
          </a>
        </div>
      </section>

      <div className="mx-auto w-full max-w-lg px-4 sm:px-6 lg:py-12">
        {/* ——— 3 adım (telefonda; masaüstünde vitrinde) ——— */}
        <Steps locale={locale} className="pt-6 lg:hidden" />

        <PisteLine className="my-6 lg:hidden" />

        {/* ——— Giriş yoksa Google ile devam; girişliyse sporcu oluşturma ——— */}
        {!signedIn ? (
          <div className="space-y-3">
            {authMsg && (
              <p role="alert" className="panel border-l-4 border-l-amber-500 bg-amber-50 p-3 text-[14px] text-ink dark:bg-amber-950/30">
                {t(locale, authMsg)}
              </p>
            )}
            <GoogleSignIn locale={locale} />
          </div>
        ) : (
          <form id="olustur" action={createCareerAction} className="scroll-mt-4 space-y-6 pb-10">
          <h2 className="display text-[28px]">{t(locale, "landing.formTitle")}</h2>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t(locale, "create.firstName")}>
              <input name="firstName" required maxLength={30} autoComplete="given-name" className={inputCls} />
            </Field>
            <Field label={t(locale, "create.lastName")}>
              <input name="lastName" required maxLength={30} autoComplete="family-name" className={inputCls} />
            </Field>
          </div>

          {/* Silah — büyük kartlar (en önemli seçim) */}
          <fieldset>
            <legend className="mb-2 text-[14px] font-semibold">{t(locale, "create.weapon")}</legend>
            <div className="grid grid-cols-3 gap-2">
              {WEAPONS.map((w) => (
                <label key={w} className="cursor-pointer">
                  <input type="radio" name="weapon" value={w} defaultChecked={w === "FOIL"} required className="peer sr-only" />
                  <span className="flex h-full flex-col items-center gap-1.5 rounded-md border-2 border-line bg-arena-1 px-1.5 pt-3 pb-2.5 text-center peer-checked:border-sig-red peer-checked:bg-arena-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ink">
                    <Icon name={weaponIcon(w)} size={48} />
                    <span className="font-display text-[18px] font-bold uppercase leading-none">{t(locale, `weapon.${w}`)}</span>
                    <span className="text-[12px] leading-tight text-steel">{t(locale, `landing.weaponHint.${w}`)}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-[14px] font-semibold">{t(locale, "create.gender")}</legend>
            <div className="flex rounded-md border border-line p-0.5">
              {GENDERS.map((g) => (
                <label key={g} className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value={g} defaultChecked={g === "MALE"} required className="peer sr-only" />
                  <span className={segCls}>{t(locale, `gender.${g}`)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <CountryCitySelect
            countries={countryOptions}
            countryLabel={t(locale, "create.country")}
            cityLabel={t(locale, "create.city")}
            defaultCountry={defaultCountry}
            inputCls={inputCls}
          />
          <p className="-mt-4 text-[13px] text-steel">{t(locale, "create.cityHint")}</p>

          <fieldset>
            <legend className="mb-2 text-[14px] font-semibold">{t(locale, "create.profile")}</legend>
            <div className="flex flex-wrap gap-1.5">
              {PROFILES.map((p) => (
                <label key={p} className="cursor-pointer">
                  <input type="radio" name="profile" value={p} defaultChecked={p === "BALANCED"} required className="peer sr-only" />
                  <span className="flex min-h-11 items-center rounded-md border border-line bg-arena-1 px-3.5 text-[14px] peer-checked:border-ink peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-arena-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ink">
                    {t(locale, `profile.${p}`)}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-1.5 text-[13px] text-steel">{t(locale, "create.profileHint")}</p>
          </fieldset>

          <button type="submit" className="btn-ink press h-12 w-full text-[16px]">
            {t(locale, "create.start")}
          </button>
          </form>
        )}
      </div>

      {/* "App gibi yükle" uyarısı (yalnız tarayıcıda, yüklü değilken) — iOS'ta yönerge, Android'de tek dokunuş. */}
      <InstallPrompt locale={locale} />
    </main>
  );
}

const inputCls =
  "min-h-11 w-full rounded-md border border-line bg-arena-1 px-3 text-[16px] outline-none focus:border-ink";

const segCls =
  "flex min-h-11 items-center justify-center rounded-[5px] text-[15px] text-steel peer-checked:bg-ink peer-checked:font-semibold peer-checked:text-arena-0 peer-focus-visible:ring-2 peer-focus-visible:ring-ink";

function Steps({ locale, className }: { locale: Locale; className: string }) {
  return (
    <ol className={`grid grid-cols-3 gap-2 ${className}`}>
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex flex-col items-center gap-1.5 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-md border border-line bg-arena-1">
            <img src={s.img} alt="" aria-hidden="true" className="h-8 w-8 object-contain" />
          </span>
          <span className="num text-[12px] text-steel">0{i + 1}</span>
          <span className="text-[13px] leading-snug">{t(locale, s.key)}</span>
        </li>
      ))}
    </ol>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[14px] font-semibold">{label}</span>
      {children}
    </label>
  );
}
