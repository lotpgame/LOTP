/**
 * LOTP ikon seti — kendi çizimimiz (hiçbir marka/ürün görselinden kopya değil). Emoji yerine her yerde bu.
 * Tek stil: 24×24 viewBox, 1.75 kalınlık çizgi, yuvarlak uçlar, renk = currentColor (text-* ile boyanır).
 * Yeni ikon eklerken aynı ızgaraya ve çizgi kalınlığına sadık kal.
 */
import type { ReactNode } from "react";

export type IconName =
  | "today"
  | "train"
  | "tournament"
  | "ranking"
  | "more"
  | "club"
  | "shop"
  | "history"
  | "settings"
  | "feedback"
  | "foil"
  | "epee"
  | "sabre"
  | "technical"
  | "physical"
  | "mental"
  | "tactical"
  | "rest"
  | "calendar"
  | "clock"
  | "rating"
  | "condition"
  | "form"
  | "physique"
  | "injury"
  | "lock"
  | "check"
  | "close"
  | "chevron-right"
  | "chevron-down"
  | "info"
  // Kariyer geçmişi
  | "trophy"
  | "medal"
  | "podium"
  // GLADIUS ekipman yuvaları
  | "mask"
  | "cord"
  | "mask-cord"
  | "jacket"
  | "plastron"
  | "lame"
  | "shoes"
  | "socks"
  | "bag"
  | "gladius"
  // Taktikler
  | "attack"
  | "balanced"
  | "defence";

const PATHS: Record<IconName, ReactNode> = {
  // Takvim yaprağı + bugünün noktası
  today: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
      <circle cx="12" cy="15" r="1.9" fill="currentColor" stroke="none" />
    </>
  ),
  // Antrenör panosu
  train: (
    <>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9.5 3.5h5v3h-5z" />
      <path d="M8.5 12.5l2 2 4.5-4.5M8.5 17.5h7" />
    </>
  ),
  // Eleme ağacı
  tournament: <path d="M3 5h5v5H3M3 14h5v5H3M8 7.5h4v9H8M12 12h4M16 9.5h5v5h-5z" />,
  // Kademeli sıralama çubukları
  ranking: (
    <>
      <rect x="3.5" y="12" width="4.5" height="8" rx="1" />
      <rect x="9.75" y="5" width="4.5" height="15" rx="1" />
      <rect x="16" y="9" width="4.5" height="11" rx="1" />
    </>
  ),
  more: (
    <>
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  // Kulüp arması
  club: <path d="M12 3l7.5 3v5.5c0 4.5-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5-7.5-9.5V6zM8.5 10.5h7M12 7.5v9" />,
  // Ekipman çantası
  shop: <path d="M4.5 8h15l-1.2 12H5.7zM9 8V6.5a3 3 0 016 0V8" />,
  // Geri saat (geçmiş)
  history: <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4v4h4M12 7.5V12l3 2" />,
  // Ayar sürgüleri
  settings: (
    <>
      <path d="M4 7h9M19 7h1M4 17h3M13 17h7" />
      <circle cx="16" cy="7" r="2.3" />
      <circle cx="10" cy="17" r="2.3" />
    </>
  ),
  feedback: <path d="M4 5.5h16v10.5H10l-6 4.5z" />,
  // Flöre: düz ince namlu, KÜÇÜK çanak
  foil: <path d="M9.5 14.5L21 3M6.8 13.2a3.2 3.2 0 0 0 4 4M8.5 15.5l-5.5 5.5" />,
  // Epe: düz namlu, büyük derin çanak
  epee: <path d="M10.5 13.5L21 3M5 11a7 7 0 0 0 8 8M8.5 15.5l-5.5 5.5" />,
  // Kılıç: hafif kavisli namlu + D şeklinde el koruması
  sabre: <path d="M10 14c4-3 7.5-6.5 11-11M6.5 11.5l6 6M6.5 11.5C4 14 3.4 18 5 21M8.5 15.5L4 20" />,
  // Teknik: namlu ucu + hareket yayı
  technical: <path d="M4 20L15 9M15 9l3.5-3.5M11 4.5a8.5 8.5 0 0 1 8.5 8.5" />,
  // Fiziksel: nabız çizgisi
  physical: <path d="M2.5 12h4l2.2-5 4.3 10 2.2-5h6.3" />,
  // Mental: hedef
  mental: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  // Taktik: pul kağıdı ızgarası (köşegen kutu karalı)
  tactical: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M12 4v16M4 12h16M5.5 5.5l5 5" />
    </>
  ),
  rest: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8.5 3v4M15.5 3v4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  // Kupa (şampiyonluk)
  trophy: <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5.5a2.5 2.5 0 0 0 2.5 4M16 6h2.5a2.5 2.5 0 0 1-2.5 4M12 13v4M9 17h6l.5 3h-7z" />,
  // Kurdeleli madalya (final)
  medal: (
    <>
      <path d="M8 3l4 7.5L16 3" />
      <circle cx="12" cy="15.5" r="4.5" />
    </>
  ),
  // Kürsü: ortada 1., solda 2., sağda 3. (madalya = ilk 3)
  podium: <path d="M3 20v-7h6M9 20V8h6v12M15 15h6v5M2.5 20h19" />,
  rating: <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 16.9l-5.3 2.7 1-5.8-4.2-4.1 5.9-.9z" />,
  condition: (
    <>
      <rect x="3" y="7" width="16" height="10" rx="2" />
      <path d="M21.5 10.5v3M6.5 10v4M10 10v4" />
    </>
  ),
  form: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  physique: <path d="M3 16.5L16.5 3 21 7.5 7.5 21zM7 12.5l2 2M10 9.5l2 2M13 6.5l2 2" />,
  injury: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)" />
      <path d="M10.5 12h.01M13.5 12h.01M12 10.5h.01M12 13.5h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
  "chevron-down": <path d="M5 9l7 7 7-7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),

  // ——— GLADIUS ekipman yuvaları (kurgusal marka; gerçek ürünlerden kopya değil) ———
  // Maske: önden oval tel + önlük
  mask: (
    <>
      <ellipse cx="12" cy="10" rx="6" ry="7" />
      <path d="M6.6 7h10.8M6 10h12M6.6 13h10.8M9 4v12M12 3v14M15 4v12" strokeWidth="1" strokeOpacity=".7" />
      <path d="M8.6 16.6L7.2 21h9.6l-1.4-4.4" />
    </>
  ),
  // Beden kordonu: sarmal kablo + 3 uçlu fiş
  cord: (
    <>
      <path d="M2 12c1.2-2.6 3-2.6 3 0s1.8 2.6 3 0 1.8-2.6 3 0 1.8 2.6 3 0" />
      <rect x="14" y="8.5" width="4.5" height="7" rx="1" />
      <path d="M18.5 10h3M18.5 12h3M18.5 14h3" />
    </>
  ),
  // Maske kordonu: kısa sarmal + mandal
  "mask-cord": <path d="M2.5 12c1.2-2.6 3-2.6 3 0s1.8 2.6 3 0 1.8-2.6 3 0M11.5 12h2.5l6-4M14 12l6 4" />,
  // Ceket: yüksek yaka + yana kaymış kapanma çizgisi
  jacket: <path d="M9 3.5h6l1.2 2 3.8 2-1.5 5-2.5-1V21H8V11.5l-2.5 1L4 7.5l3.8-2zM9 3.5c.4 1.4 1.5 2.2 3 2.2s2.6-.8 3-2.2M14.5 6v15" />,
  // Plastron: tek kol + göğüs yarısı, çapraz kayış
  plastron: <path d="M12 3.5H9l-5 4 1.5 5 2.5-1V21h4zM12 7.5l5.5 2.5-1 2" />,
  // Lamé: kolsuz yelek + çapraz tarama
  lame: (
    <>
      <path d="M8.5 3.5h7l2 3.5V21h-11V7zM8.5 3.5c.5 2 1.8 3 3.5 3s3-1 3.5-3" />
      <path d="M7 14l5-5M7 18.5l8-8M10.5 20.5l6.5-6.5" strokeWidth="1" strokeOpacity=".7" />
    </>
  ),
  // Ayakkabı: düz taban, güçlendirilmiş burun
  shoes: <path d="M3 17v-4l3-.8 3.2-4.7h3l1 3 5 1.5c2 .6 3.3 1.9 3.3 3.6V17zM3 17v1.5h18.5V17M17 12.3v4.7" />,
  // Diz çorabı
  socks: <path d="M9 3h6v10.5l3.4 3.4a2.5 2.5 0 0 1-3.5 3.5l-4.9-4.9L9 14zM9 6.5h6M9 9h6" />,
  // Uzun silah çantası
  bag: (
    <>
      <rect x="2" y="9" width="20" height="7.5" rx="3.75" />
      <path d="M9 9V7.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V9M5.5 12.75h13" />
    </>
  ),
  // GLADIUS monogramı: çanak halkası içinde G, üstten geçen namlu
  gladius: (
    <>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 1.5V6M15.4 10.8a4 4 0 1 0 .1 4.6V13h-3" />
    </>
  ),

  // ——— Taktikler ———
  // Atak: ileri giden namlu-ok
  attack: <path d="M4 20L19 5M12 5h7v7" />,
  // Dengeli: terazi
  balanced: <path d="M12 4v16M8.5 20h7M5 8h14M5 8l-2.5 5a2.5 2.5 0 0 0 5 0zM19 8l-2.5 5a2.5 2.5 0 0 0 5 0z" />,
  // Defans: kalkan
  defence: <path d="M12 3l7.5 3v5.5c0 4.5-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5-7.5-9.5V6z" />,
};

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

/** Silah kodu (FOIL/EPEE/SABRE) → ikon adı. */
export function weaponIcon(weapon: string): IconName {
  return weapon === "EPEE" ? "epee" : weapon === "SABRE" ? "sabre" : "foil";
}
