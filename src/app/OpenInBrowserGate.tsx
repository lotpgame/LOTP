"use client";

/**
 * Uygulama içi tarayıcıdan (Instagram/Facebook/TikTok) gelenlere tam ekran yönlendirme.
 * NEDEN: bu tarayıcılar ekranı DİKEY kilitler → yatay oyun "telefonu yan çevir" (RotateGate) ekranında
 * sonsuza kadar sıkışır. Çözüm telefonu döndürmek DEĞİL, oyunu gerçek tarayıcıda (Chrome/Safari) açmaktır.
 * Oradan "ana ekrana ekle" (InstallPrompt) ile uygulama gibi de kurulabilir.
 *
 * Gösterim: dik tutuşta (portrait) — iç tarayıcı zaten hep dikeydir. Masaüstünde (lg) hiç çıkmaz.
 * "Linki kopyala" en garantili yol (menüyü bulamayan kullanıcı linki Chrome/Safari'ye yapıştırır).
 */
import { useState } from "react";
import { t, type Locale } from "@/i18n";

export function OpenInBrowserGate({ locale }: { locale: Locale }) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = window.location.origin + "/";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Kopyalama engellenirse (izin yok) — sessiz geç; kullanıcı menüden açabilir.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[210] hidden flex-col items-center justify-center gap-6 bg-[#0b0e12] px-8 text-center portrait:flex lg:!hidden"
    >
      {/* Tarayıcı penceresi + ok ikonu (dışarı aç) */}
      <svg width="76" height="76" viewBox="0 0 48 48" fill="none" aria-hidden="true">
        <rect x="6" y="9" width="36" height="30" rx="4" stroke="#e8ecf0" strokeWidth="2" />
        <line x1="6" y1="17" x2="42" y2="17" stroke="#e8ecf0" strokeWidth="2" />
        <circle cx="10.5" cy="13" r="1.3" fill="#e8ecf0" />
        <circle cx="15" cy="13" r="1.3" fill="#e8ecf0" />
        <path d="M22 31l9-9m0 0h-6m6 0v6" stroke="#e05a4b" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>

      <div className="max-w-sm">
        <p className="font-display text-[24px] font-bold text-[#e8ecf0]">{t(locale, "openBrowser.title")}</p>
        <p className="mt-2 text-[15px] leading-relaxed text-[#9aa3ad]">{t(locale, "openBrowser.desc")}</p>
      </div>

      <button
        type="button"
        onClick={copyLink}
        className="min-h-12 rounded-md bg-[#e8ecf0] px-6 text-[15px] font-semibold text-[#0b0e12] active:scale-[0.98]"
      >
        {copied ? t(locale, "openBrowser.copied") : t(locale, "openBrowser.copyLink")}
      </button>
      <p className="-mt-2 text-[13px] text-[#6b7480]">{t(locale, "openBrowser.copyHint")}</p>
    </div>
  );
}
