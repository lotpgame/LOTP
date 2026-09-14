import { setLocaleAction } from "@/app/actions";
import { LOCALES, LOCALE_LABEL, t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { CareerResetButton, SoundToggle } from "./AyarlarClient";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  const locale = await getLocale();

  return (
    <main>
      <h1 className="text-xl font-bold">⚙️ {t(locale, "settings.title")}</h1>

      {/* Dil */}
      <section className="mt-5">
        <h2 className="text-lg font-semibold">🌐 {t(locale, "settings.language")}</h2>
        <p className="mt-1 text-xs opacity-60">{t(locale, "settings.languageNote")}</p>
        <div className="mt-3 flex gap-2">
          {LOCALES.map((loc) => (
            <form key={loc} action={setLocaleAction}>
              <input type="hidden" name="locale" value={loc} />
              <button
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  locale === loc
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    : "border-black/15 opacity-70 hover:opacity-100 dark:border-white/20"
                }`}
              >
                {loc === "tr" ? "🇹🇷" : "🇬🇧"} {LOCALE_LABEL[loc]}
              </button>
            </form>
          ))}
        </div>
      </section>

      {/* Ses */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">🔊 {t(locale, "settings.sound")}</h2>
        <p className="mt-1 text-xs opacity-60">{t(locale, "settings.soundNote")}</p>
        <div className="mt-3">
          <SoundToggle locale={locale} />
        </div>
      </section>

      {/* Kariyer */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold">👤 {t(locale, "settings.career")}</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <CareerResetButton
              locale={locale}
              label={t(locale, "settings.newCareer")}
              warning={t(locale, "settings.deleteWarning")}
            />
            <p className="mt-1 text-xs opacity-50">{t(locale, "settings.newCareerNote")}</p>
          </div>
          <div>
            <CareerResetButton
              locale={locale}
              label={t(locale, "settings.deleteCareer")}
              warning={t(locale, "settings.deleteWarning")}
              danger
            />
          </div>
        </div>
      </section>
    </main>
  );
}
