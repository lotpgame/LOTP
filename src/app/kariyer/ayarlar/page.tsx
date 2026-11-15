import { redirect } from "next/navigation";
import { ArenaPage } from "@/app/ArenaPage";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer } from "@/server/careerService";
import { CareerResetButton } from "./AyarlarClient";
import { LangModal } from "./LangModal";
import { GorunumModal } from "./GorunumModal";
import { SozlukModal } from "./SozlukModal";
import { FeedbackWidget } from "../FeedbackWidget";
import { glossaryFor } from "../sozluk/glossary";

export const dynamic = "force-dynamic";

// Ayarlar = tek-tık satırlar; her satır öne açılan bir pop-up (kullanıcı kararı 15.11). Ses kaldırıldı
// (ses eklenince geri gelir). "Yeni Başla" (kariyer sıfırlama) en altta, kırmızı.
const ROW = "press flex min-h-14 w-full items-center gap-3 rounded-md border border-line bg-arena-1 px-3 text-[15px]";

export default async function AyarlarPage() {
  const locale = await getLocale();
  const c = await getCareer();
  if (!c) redirect("/");
  const sections = glossaryFor(locale);

  return (
    <ArenaPage bg="/img/bg-ayarlar.webp">
      <h1 className="display text-[28px]">{t(locale, "settings.title")}</h1>

      <div className="mt-4 flex flex-col gap-2">
        {/* Dil → pop-up (listeden seç) */}
        <LangModal current={locale} rowClassName={ROW} />

        {/* Görünüm → pop-up (arka fon + yazı rengi) */}
        <GorunumModal locale={locale} rowClassName={ROW} />

        {/* Geri bildirim → tek tık doğrudan bildirim penceresi (ara adım yok) */}
        <FeedbackWidget locale={locale} className={ROW} withChevron />

        {/* Sözlük → pop-up (arama + kaydırmalı) */}
        <SozlukModal locale={locale} sections={sections} rowClassName={ROW} />
      </div>

      {/* Yeni Başla — en altta, kırmızı (çift onaylı kariyer sıfırlama). */}
      <div className="mt-8 border-t border-line pt-4">
        <CareerResetButton
          locale={locale}
          label={t(locale, "settings.newCareer")}
          warning={t(locale, "settings.deleteWarning")}
          warning2={t(locale, "settings.deleteWarning2")}
          danger
        />
        <p className="mt-1.5 text-[13px] text-steel">{t(locale, "settings.newCareerNote")}</p>
      </div>
    </ArenaPage>
  );
}
