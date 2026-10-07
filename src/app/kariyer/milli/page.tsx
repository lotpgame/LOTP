import Link from "next/link";
import { redirect } from "next/navigation";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { getCareer, getNationalTeam } from "@/server/careerService";
import { MilliTakimFilter } from "../MilliTakimFilter";

export const dynamic = "force-dynamic";

/**
 * Milli Takım — profildeki "Milli Takım" rozetinden gelinir. Kendi kategorinin milli takımını (ilk 4 + overall)
 * gösterir; yaş/silah/cinsiyet filtresiyle başka kategorilerin millilerine de bakılır (reytingleri yakından tanı).
 */
export default async function MilliTakimPage() {
  const c = await getCareer();
  if (!c) redirect("/");
  const locale = await getLocale();
  const members = await getNationalTeam(c.categoryId);

  return (
    <main className="flex flex-col gap-4">
      <Link href="/kariyer" className="inline-flex min-h-11 items-center text-[14px] text-steel underline underline-offset-2">
        {t(locale, "idp.back")}
      </Link>
      <h1 className="display text-[28px]">{t(locale, "milli.title")}</h1>
      <p className="text-[14px] text-steel">{t(locale, "milli.note")}</p>
      <MilliTakimFilter initialCategoryId={c.categoryId} initialMembers={members} locale={locale} />
    </main>
  );
}
