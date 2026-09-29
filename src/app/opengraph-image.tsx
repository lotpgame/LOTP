import { ImageResponse } from "next/og";

/**
 * WhatsApp/sosyal medya önizleme görseli (P1) — "headline.shareTail" ile paylaşılan bağlantı hep site
 * kökü olduğu için (bkz. HeadlineCard.tsx whatsAppHref) tek, sabit bir görsel yeterli; sonuca özel değil.
 * Build zamanında üretilip önbelleğe alınır (request-time API kullanmıyor). Pist Konsolu renk token'ları
 * elle kopyalandı — bu dosya globals.css'i import edemez (satori CSS değil, ayrı bir render motoru).
 */
export const alt = "Legends of the Piste — eskrim kariyer simülasyonu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#0b0e12";
const INK = "#e8ecf0";
const STEEL = "#9aa3ad";
const GOLD = "#c9962b";
const RED = "#ff4a4a";
const GREEN = "#22c77a";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: BG,
        }}
      >
        <div style={{ display: "flex", height: 10, width: "100%", background: GOLD }} />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              maxWidth: 1000,
              textAlign: "center",
              justifyContent: "center",
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -1,
              color: INK,
              textTransform: "uppercase",
            }}
          >
            Legends of the Piste
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 34, color: STEEL }}>
            Eskrim kariyer simülasyonu
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 40 }}>
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 999, background: RED }} />
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 999, background: GREEN }} />
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 999, background: GOLD }} />
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
