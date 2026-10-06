/**
 * Pist geometrisinden türeyen iki öğe (14 m pist, ölçek 1 birim = 10 cm → 140 birim):
 * orta çizgi (70), en-garde çizgileri (50 / 90), uç uyarı bölgeleri (0–20 / 120–140).
 *  - PisteRail: değer rayı (boş çubuk yerine). Dolgu soldan, başında kırmızı işaret.
 *  - PisteLine: bölüm ayırıcı (aynı geometri, dolgusuz).
 */

function Marks({ over }: { over: string }) {
  // Çizgiler dolgunun üstünde, zemin renginde → dolu kısımda da seçilir.
  return (
    <>
      <line x1="70" x2="70" y1="0" y2="6" stroke={over} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
      <line x1="50" x2="50" y1="0" y2="6" stroke={over} strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <line x1="90" x2="90" y1="0" y2="6" stroke={over} strokeWidth="1" vectorEffect="non-scaling-stroke" />
    </>
  );
}

export function PisteRail({ value, max, className = "" }: { value: number; max: number; className?: string }) {
  const x = Math.max(0, Math.min(1, value / max)) * 140;
  return (
    <svg viewBox="0 0 140 6" preserveAspectRatio="none" className={`block h-1.5 w-full text-ink ${className}`} aria-hidden="true">
      <rect width="140" height="6" fill="var(--line)" />
      <rect width="20" height="6" fill="var(--prio)" fillOpacity=".18" />
      <rect x="120" width="20" height="6" fill="var(--prio)" fillOpacity=".18" />
      <rect width={x} height="6" fill="currentColor" />
      <Marks over="var(--arena-0)" />
      {x > 0 && <rect x={Math.max(0, x - 1.5)} width="1.5" height="6" fill="var(--sig-red)" />}
    </svg>
  );
}

export function PisteLine({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 6" preserveAspectRatio="none" className={`block h-1.5 w-full ${className}`} aria-hidden="true">
      <rect width="140" height="6" fill="var(--arena-1)" stroke="var(--line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <rect width="20" height="6" fill="var(--prio)" fillOpacity=".14" />
      <rect x="120" width="20" height="6" fill="var(--prio)" fillOpacity=".14" />
      <Marks over="var(--line)" />
    </svg>
  );
}

/**
 * 10 parçalı gösterge (kondisyon/form) — trafik lambası renkleri yok, durum yazıyla söylenir.
 * `glow`: değer yüksekken dolu parçalar hafifçe nabız gibi parlar (GORSEL §8; hareketi azalt açıkken parıltı yok).
 */
export function Segments({ value, glow = false, className = "" }: { value: number; glow?: boolean; className?: string }) {
  const filled = Math.round(Math.max(0, Math.min(100, value)) / 10);
  return (
    <div className={`flex gap-[3px] ${className}`} aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-[2px] ${i < filled ? `bg-ink ${glow ? "fx-glow anim-glow" : ""}` : "bg-line"}`}
        />
      ))}
    </div>
  );
}
