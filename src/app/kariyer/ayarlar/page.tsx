import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import { LangSelect } from "@/app/LangSelect";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { CAREER_RESET_COST, getCareer } from "@/server/careerService";
import { CareerResetButton, SoundToggle } from "./AyarlarClient";
import { ThemeSettings } from "../ThemeSettings";
import { ViewSettings } from "../ViewSettings";

export const dynamic = "force-dynamic";

export default async function AyarlarPage() {
  const locale = await getLocale();
  const c = await getCareer();
  if (!c) redirect("/");
  const canAfford = c.balance >= CAREER_RESET_COST;

  return (
    <ArenaPage bg="/img/bg-ayarlar.webp">
      <h1 className="display text-[28px]">{t(locale, "settings.title")}</h1>

      {/* Dil */}
      <section className="mt-5">
        <h2 className="display text-[22px]">{t(locale, "settings.language")}</h2>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "settings.languageNote")}</p>
        <div className="mt-3">
          <LangSelect current={locale} />
        </div>
      </section>

      {/* Görünüm — oyun düzeni (klasik/yatay) + kişiye özel arka fon + yazı rengi */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "settings.appearance")}</h2>
        <div className="mt-3">
          <span className="kicker">{t(locale, "settings.view")}</span>
          <div className="mt-1.5">
            <ViewSettings locale={locale} />
          </div>
        </div>
        <div className="mt-5 border-t border-line pt-5">
          <ThemeSettings locale={locale} />
        </div>
      </section>

      {/* Ses */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "settings.sound")}</h2>
        <p className="mt-1 text-[13px] text-steel">{t(locale, "settings.soundNote")}</p>
        <div className="mt-3">
          <SoundToggle locale={locale} />
        </div>
      </section>

      {/* Kariyer */}
      <section className="mt-8">
        <h2 className="display text-[22px]">{t(locale, "settings.career")}</h2>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <CareerResetButton
              locale={locale}
              label={t(locale, "settings.newCareer")}
              warning={t(locale, "settings.deleteWarning")}
              cost={CAREER_RESET_COST}
              canAfford={canAfford}
              danger
            />
            <p className="mt-1 text-[13px] text-steel">{t(locale, "settings.newCareerNote")}</p>
          </div>
        </div>
      </section>
    </ArenaPage>
  );
}
