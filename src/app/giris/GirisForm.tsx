"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signInWithPhoneAction } from "@/app/actions";
import { t, type Locale } from "@/i18n";
import { Icon } from "@/app/ui/Icon";

/** Telefonla giriş formu (M9.2). Kod doğrulaması henüz yok (dev); yalnız numara + ülke. */
export function GirisForm({ locale }: { locale: Locale }) {
  const [phone, setPhone] = useState("+90 ");
  const [err, setErr] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    setErr(null);
    setLinked(false);
    start(async () => {
      const res = await signInWithPhoneAction(phone);
      if (res.ok) {
        if (res.linked) setLinked(true);
        router.push("/kariyer");
        router.refresh();
      } else {
        setErr(res.reason === "unsupported" ? t(locale, "giris.errUnsupported") : t(locale, "giris.errFormat"));
      }
    });
  };

  return (
    <div className="mt-4">
      <label className="block">
        <span className="mb-1 block text-sm opacity-70">{t(locale, "giris.phoneLabel")}</span>
        <input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => {
            setErr(null);
            setPhone(e.target.value);
          }}
          placeholder={t(locale, "giris.placeholder")}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-emerald-500 dark:border-white/20"
        />
      </label>
      {err && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{err}</p>}
      {linked && (
        <p role="status" className="mt-2 flex items-center gap-1.5 text-sm">
          <Icon name="check" size={16} />
          {t(locale, "giris.linked")}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="mt-3 w-full rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
      >
        {t(locale, "giris.submit")}
      </button>
    </div>
  );
}
