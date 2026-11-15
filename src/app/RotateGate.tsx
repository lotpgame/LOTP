import { t, type Locale } from "@/i18n";

/**
 * Oyun YALNIZ yatay oynanır (app kararı). Cihaz dik tutulunca tüm ekranı kaplayan karşılama + "telefonu yan
 * çevir" uyarısı — GERÇEK cihaz yönüne göre (CSS `portrait:` media query). Masaüstünde (lg) hiç çıkmaz.
 * Marka logosu + "Hoş geldiniz" ile sıcak ilk izlenim (kullanıcı 15.11). Renkler koyu/sabit (temadan bağımsız).
 */
export function RotateGate({ locale }: { locale: Locale }) {
  return (
    <div className="fixed inset-0 z-[200] hidden flex-col items-center justify-center gap-4 bg-[#0b0e12] px-8 text-center portrait:flex lg:!hidden">
      {/* Marka logosu (saydam amblem) */}
      <img src="/img/logo-mark.png" alt="Legends of the Piste" width={200} height={200} className="w-48 max-w-[65vw]" />
      <p className="font-display text-[22px] font-bold text-[#c9a24a]">{t(locale, "rotate.welcome")}</p>

      {/* Dönen telefon ikonu */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 48 48"
        fill="none"
        style={{ transformOrigin: "center", animation: "rotateHint 2.4s ease-in-out infinite" }}
      >
        <rect x="17" y="6" width="14" height="30" rx="3" stroke="#e8ecf0" strokeWidth="2" />
        <line x1="21.5" y1="32" x2="26.5" y2="32" stroke="#e8ecf0" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <div>
        <p className="font-display text-[22px] font-bold text-[#e8ecf0]">{t(locale, "rotate.title")}</p>
        <p className="mt-1 text-[15px] text-[#9aa3ad]">{t(locale, "rotate.desc")}</p>
      </div>
    </div>
  );
}
