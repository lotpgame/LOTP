"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { setLocaleAction } from "@/app/actions";
import { LOCALE_LABEL, LOCALES, type Locale } from "@/i18n";

/** Dil seçimi — açılır menü (TR/EN/DE/ES/FR). Seçince cookie'ye yazar + sayfayı tazeler. */
export function LangSelect({ current }: { current: Locale }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <select
      defaultValue={current}
      disabled={pending}
      aria-label="Dil / Language"
      onChange={(e) => {
        const fd = new FormData();
        fd.set("locale", e.target.value);
        start(async () => {
          await setLocaleAction(fd);
          router.refresh();
        });
      }}
      className="min-h-11 rounded-md border border-line bg-arena-1 px-2.5 text-[14px] outline-none focus:border-ink disabled:opacity-50"
    >
      {/* Diller görünen ada göre alfabetik (kullanıcı 09.11). */}
      {[...LOCALES].sort((a, b) => LOCALE_LABEL[a].localeCompare(LOCALE_LABEL[b])).map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
