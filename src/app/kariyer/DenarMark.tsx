/**
 * Denar para birimi işareti — "D" harfinin ortasından bir kılıç (eskrim) geçer. Özel glif (SVG).
 * currentColor ile çizilir → metin rengini alır, temaya uyar. Miktarların önünde kullanılır.
 */
export function DenarMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Denar"
      role="img"
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.15em" }}
    >
      {/* D harfi (dış hat) */}
      <path
        d="M7 4 L7 20 M7 4 L13 4 C19 4 21 8 21 12 C21 16 19 20 13 20 L7 20"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Kılıç — D'nin ortasından yatay geçer: kabza + siper + namlu + sivri uç */}
      <line x1="1.5" y1="12" x2="22.5" y2="12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Kabza topuzu (solda) */}
      <circle cx="2.2" cy="12" r="1.5" fill="currentColor" />
      {/* Siper (kabza ile namlu arası) */}
      <line x1="5" y1="9.4" x2="5" y2="14.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      {/* Sivri uç (sağda) */}
      <path d="M22.5 12 L20 10.6 L20 13.4 Z" fill="currentColor" />
    </svg>
  );
}
