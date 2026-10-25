import { t, type Locale } from "@/i18n";

/**
 * Oyun YALNIZ yatay oynanır (app kararı). Cihaz dik tutulunca tüm ekranı kaplayan
 * "telefonu yan çevir" uyarısı — GERÇEK cihaz yönüne göre (CSS `portrait:` media query,
 * data-view ayarından bağımsız). Masaüstünde (lg) hiç çıkmaz. Renkler koyu/sabit (temadan bağımsız).
 */
export function RotateGate({ locale }: { locale: Locale }) {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[200] hidden flex-col items-center justify-center gap-5 bg-[#0b0e12] px-10 text-center portrait:flex lg:!hidden"
    >
      <svg
        width="72"
        height="72"
        viewBox="0 0 48 48"
        fill="none"
        style={{ transformOrigin: "center", animation: "rotateHint 2.4s ease-in-out infinite" }}
      >
        <rect x="17" y="6" width="14" height="30" rx="3" stroke="#e8ecf0" strokeWidth="2" />
        <line x1="21.5" y1="32" x2="26.5" y2="32" stroke="#e8ecf0" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <p className="font-display text-[24px] font-bold text-[#e8ecf0]">{t(locale, "rotate.title")}</p>
        <p className="mt-1 text-[15px] text-[#9aa3ad]">{t(locale, "rotate.desc")}</p>
      </div>
    </div>
  );
}
