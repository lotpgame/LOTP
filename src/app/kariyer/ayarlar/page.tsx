import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import { LangSelect } from "@/app/LangSelect";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { CAREER_RESET_COST, getCareer } from "@/server/careerService";
import { CareerResetButton, SoundToggle } from "./AyarlarClient";
import { CollapsibleSection } from "../CollapsibleSection";
import { FeedbackWidget } from "../FeedbackWidget";
import { ThemeSettings } from "../ThemeSettings";

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
      <CollapsibleSection title={t(locale, "settings.language")} defaultOpen>
        <p className="text-[13px] text-steel">{t(locale, "settings.languageNote")}</p>
        <div className="mt-3">
          <LangSelect current={locale} />
        </div>
      </CollapsibleSection>

      {/* Görünüm — kişiye özel arka fon + yazı rengi (oyun düzeni YATAY sabittir; seçenek yok) */}
      <CollapsibleSection title={t(locale, "settings.appearance")}>
        <ThemeSettings locale={locale} />
      </CollapsibleSection>

      {/* Ses */}
      <CollapsibleSection title={t(locale, "settings.sound")}>
        <p className="text-[13px] text-steel">{t(locale, "settings.soundNote")}</p>
        <div className="mt-3">
          <SoundToggle locale={locale} />
        </div>
      </CollapsibleSection>

      {/* Kariyer */}
      <CollapsibleSection title={t(locale, "settings.career")}>
        <div className="flex flex-col gap-3">
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
      </CollapsibleSection>

      {/* Bildir — geri bildirim / hata (menüden Ayarlar'a taşındı 06.11, kullanıcı kararı). */}
      <CollapsibleSection title={t(locale, "feedback.title")}>
        <FeedbackWidget
          locale={locale}
          className="press flex min-h-11 w-full items-center gap-3 rounded-md border border-line bg-arena-1 px-3 text-[15px]"
        />
      </CollapsibleSection>
    </ArenaPage>
  );
}
