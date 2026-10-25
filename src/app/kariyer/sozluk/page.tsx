import { t } from "@/i18n";
import { ArenaPage } from "@/app/ArenaPage";
import { getLocale } from "@/i18n/server";
import { glossaryFor } from "./glossary";
import { CollapsibleSection } from "../CollapsibleSection";

export const dynamic = "force-dynamic";

/** Sözlük — eskrim ve oyun terimleri (P1). Yalnız statik içerik; kariyer verisine ihtiyaç yok. */
export default async function SozlukPage() {
  const locale = await getLocale();
  const sections = glossaryFor(locale);

  return (
    <ArenaPage bg="/img/bg-sozluk.webp">
      <h1 className="display text-[28px]">{t(locale, "nav.sozluk")}</h1>
      <div className="mt-3 flex flex-col gap-3">
        {sections.map((section) => (
          <CollapsibleSection key={section.title} title={section.title}>
            <dl className="panel divide-y divide-line overflow-hidden">
              {section.terms.map((entry) => (
                <div key={entry.term} className="px-4 py-3">
                  <dt className="text-[15px] font-semibold">{entry.term}</dt>
                  <dd className="mt-0.5 text-[14px] text-steel">{entry.definition}</dd>
                </div>
              ))}
            </dl>
          </CollapsibleSection>
        ))}
      </div>
    </ArenaPage>
  );
}
