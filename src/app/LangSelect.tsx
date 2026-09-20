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
      className="rounded-lg border border-black/15 bg-transparent px-2.5 py-1.5 text-sm outline-none focus:border-emerald-500 disabled:opacity-50 dark:border-white/20"
    >
      {LOCALES.map((l) => (
        <option key={l} value={l}>
          {LOCALE_LABEL[l]}
        </option>
      ))}
    </select>
  );
}
