import Link from "next/link";
import { t } from "@/i18n";
import { getLocale } from "@/i18n/server";
import { GirisForm } from "./GirisForm";

export const dynamic = "force-dynamic";

export default async function GirisPage() {
  const locale = await getLocale();
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8 sm:px-6">
      <Link href="/" className="text-sm text-emerald-600 hover:underline">
        {t(locale, "giris.back")}
      </Link>
      <h1 className="mt-3 text-2xl font-bold">{t(locale, "giris.title")}</h1>
      <p className="mt-1 text-sm opacity-70">{t(locale, "giris.hint")}</p>
      <GirisForm locale={locale} />
      <p className="mt-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
        {t(locale, "giris.devNote")}
      </p>
    </main>
  );
}
