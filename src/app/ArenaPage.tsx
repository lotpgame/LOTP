import type { ReactNode } from "react";

/**
 * Tüm sayfalar için ortak "arena" kabuğu (Championship Manager tarzı tam-sayfa görsel).
 *
 * - `bg`: sayfaya özel fotoğraf; SABİT (fixed) tam-sayfa arka plan (z-0), üstünde karartma.
 *   İçerik z-10 → mobil tarayıcılarda da garanti görünür (negatif z-index gizleniyordu).
 * - `data-scope="console"`: kullanıcı teması ne olursa olsun koyu paleti uygular (globals.css).
 *   Fotoğraflar koyu olduğu için sayfa bilerek koyu "arena"dır; böylece yazı/panel HER temada
 *   (açık "Salon" teması dahil) okunur kalır — açık tema + koyu fotoğraf çakışması olmaz.
 * - `dim`: karartma yoğunluğu (0–100). Fotoğrafı daha çok göstermek için düşür.
 */
export function ArenaPage({
  bg,
  dim = 60,
  className = "flex flex-col gap-4",
  children,
}: {
  bg: string;
  dim?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <main data-scope="console" data-arena="" style={{ background: "transparent" }} className="relative">
      {/* translateZ(0): arka planı ayrı compositor katmanına al → üstteki panellerin backdrop-filter'ı
          açılıp/kapanırken arka plan yeniden çizilip "derinlik gidip geliyor" titremesi olmasın. */}
      <div aria-hidden="true" className="fixed inset-0 z-0" style={{ transform: "translateZ(0)", willChange: "transform" }}>
        <img src={bg} alt="" className="h-full w-full object-cover object-center" />
        <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${dim / 100})` }} />
      </div>
      <div className={`relative z-10 ${className}`}>{children}</div>
    </main>
  );
}
