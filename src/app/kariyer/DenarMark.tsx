/**
 * Denar para birimi işareti — kullanıcının altın "Đ" sikke logosu (public/img/ui/denar.webp).
 * Miktarların önünde kullanılır. API aynı (size, className) → tüm mevcut kullanımlar çalışır.
 */
export function DenarMark({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/img/ui/denar.webp"
      alt="Denar"
      width={size}
      height={size}
      className={className}
      style={{ display: "inline-block", verticalAlign: "-0.18em", width: size, height: size }}
    />
  );
}
