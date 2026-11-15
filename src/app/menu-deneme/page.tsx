/**
 * YALNIZ GÖRSEL DENEME — futbol oyunu tarzı tek yatay üst menü barını LOTP temasıyla denemek için.
 * Gerçek CareerNav'a dokunmaz; canlıya gitmez (local test). Beğenilirse CareerNav'a uyarlanır.
 */
import { Icon } from "@/app/ui/Icon";
import { WorldClockBadge } from "@/app/kariyer/WorldClockBadge";
import { DenarBadge } from "@/app/kariyer/DenarBadge";

export const dynamic = "force-dynamic";

// Gerçek menü sekmeleri (CareerNav NAV sırası) — TR etiketleriyle.
// Ayarlar YOK: zaten sağ üstte ayar ikonu var (kullanıcı kararı).
const TABS = [
  { label: "Bugün", active: true },
  { label: "Kulüp" },
  { label: "Antrenman" },
  { label: "Ekipman" },
  { label: "Turnuvalar", badge: "1" }, // futbol örneğindeki LIVE(1) gibi — canlı turnuva rozeti
  { label: "Klasman" },
  { label: "Kariyer" },
];

export default function MenuDenemePage() {
  return (
    <div
      className="min-h-screen bg-arena-0 text-ink"
      style={{
        backgroundImage: "linear-gradient(180deg, rgba(8,11,15,.78), rgba(8,11,15,.92)), url(/img/bg-bugun.webp)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* ——— DENEME: tek yatay üst menü barı (futbol oyunu stili) ——— */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-white/10 bg-black/40 px-3 backdrop-blur sm:px-4">
        {/* Sol: oyun zamanı (GMT) — logo yok (açılışta görünüyor, oyun içinde gereksiz) */}
        <div className="shrink-0">
          <WorldClockBadge locale="tr" />
        </div>

        {/* Orta: sekmeler tek sırada (dar ekranda yatay kaydırılır) */}
        <nav className="flex flex-1 items-stretch gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Menü">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              aria-current={tab.active ? "page" : undefined}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 font-display text-[14px] font-bold uppercase tracking-wide transition-colors ${
                tab.active ? "text-white" : "text-white/55 hover:text-white/85"
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-sig-red px-1 text-[11px] font-bold text-white num">
                  {tab.badge}
                </span>
              )}
              {/* Aktif sekme: altında "en-garde" çizgisi (LOTP kırmızısı) */}
              {tab.active && <span className="absolute inset-x-2.5 -bottom-[1px] h-[3px] rounded-t-full bg-sig-red" aria-hidden="true" />}
            </button>
          ))}
        </nav>

        {/* Sağ: Denar kazan/al + ayar dişlisi (bizim settings ikonu) */}
        <div className="flex shrink-0 items-center gap-2">
          <DenarBadge
            locale="tr"
            balance={50}
            adsLeft={5}
            adDailyCap={5}
            adReward={2}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[13px] font-semibold text-white"
          />
          <button
            type="button"
            aria-label="Ayarlar"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/85 hover:text-white"
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>

      {/* Sayfa gövdesi — yalnız menünün nasıl durduğunu görmek için hafif örnek içerik. */}
      <main className="mx-auto max-w-5xl px-4 py-10 text-center">
        <p className="font-display text-[22px] font-bold text-white/90">Menü denemesi</p>
        <p className="mt-2 text-[14px] text-white/55">
          Üstteki bar = futbol oyunundaki gibi tek yatay menü. Gerçek menü değiştirilmedi; bu yalnızca görsel deneme
          (<span className="num">/menu-deneme</span>).
        </p>
        <p className="mt-6 text-[13px] text-white/40">
          Beğenirsen CareerNav'ı bu tek-bar düzenine (telefon-yatay + masaüstü) uyarlarım.
        </p>
      </main>
    </div>
  );
}
