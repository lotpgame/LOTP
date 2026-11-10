"use client";

/**
 * Kayıt tamamlanınca (create → /kariyer?welcome=1) BİR KEZ çıkan karşılama ekranı (kullanıcı 10.11):
 * baş antrenör çocuğu karşılar, başlangıç ekipmanını hediye eder ve "dikkatli kullan" ipucu verir.
 * Kapatınca URL'den ?welcome=1 düşer (reload'da tekrar çıkmaz). Yalnızca mevcut veriler kullanılır.
 */
import { useRouter } from "next/navigation";
import { useState } from "react";
import { t, type Locale } from "@/i18n";

export function WelcomeDialog({
  locale,
  name,
  coach,
  club,
  weapon,
}: {
  locale: Locale;
  name: string;
  coach: string;
  club: string;
  weapon: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  if (!open) return null;

  const close = () => {
    setOpen(false);
    router.replace("/kariyer"); // ?welcome=1 düşsün
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 px-4 py-6" role="dialog" aria-modal="true">
      <div className="panel w-full max-w-md overflow-hidden rounded-xl border border-line bg-arena-0 shadow-2xl">
        {/* Üst şerit — antrenör karşılaması */}
        <div data-scope="console" className="mesh px-5 pt-5 pb-4 text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-console-line bg-console-1 text-[28px]">
            🤺
          </div>
          <p className="font-display text-[22px] font-bold text-console-ink">{t(locale, "welcome.title", { name })}</p>
          <p className="mt-0.5 text-[13px] text-console-steel">{t(locale, "welcome.coachLine", { coach })}</p>
        </div>

        <div className="space-y-3 px-5 py-4 text-[14px] leading-relaxed">
          <p>{t(locale, "welcome.greeting", { club })}</p>
          <div className="rounded-lg border border-line bg-arena-1 p-3">
            <p className="flex items-start gap-2">
              <span aria-hidden="true">🎁</span>
              <span>{t(locale, "welcome.gift", { weapon })}</span>
            </p>
          </div>
          <p className="flex items-start gap-2 text-steel">
            <span aria-hidden="true">⚠️</span>
            <span>{t(locale, "welcome.hint")}</span>
          </p>
        </div>

        <div className="px-5 pb-5">
          <button type="button" onClick={close} className="btn-ink press h-12 w-full text-[16px]">
            {t(locale, "welcome.cta")}
          </button>
        </div>
      </div>
    </div>
  );
}
