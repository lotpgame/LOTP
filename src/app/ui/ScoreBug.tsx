/**
 * Skor bandı — eskrim cihazı dili (düz bir bant; gerçek bir cihaz markasının görünümü değil).
 * Kural: KIRMIZI = SOL, YEŞİL = SAĞ; renk iyi/kötü demek değildir. "Sen" renkle değil SEN etiketiyle
 * belirtilir. Her zaman koyu (data-scope="console"), kullanıcı teması etkilemez.
 * `flash`: son tuşu alan taraf ("both" = çift tuş) — lambası bir kez yanıp söner (hareketi azalt tercihinde yanıp sönmez).
 * `hitFx`: canlı anlatımda tuş kutlaması (GORSEL_ETKILESIM §6) — lamba hale saçar, skor rakamı sıçrar, "+1" yükselir,
 *   bant hafif titrer. Giriş ekranındaki duran örnek bant bunu kullanmaz.
 * `white`: beyaz lamba (flöre hedef dışı) — o tarafın beyaz lambası, pistin ortasına bakan uçta yanar; skor değişmez.
 * `band`: bant sabitken (sticky) kaybolan periyot bilgisini üstte tutan durum etiketi ("2. Periyot" /
 * altın tuşta `prio` ile --prio altın rengi) — gerçek eskrim cihazlarındaki periyot/öncelik göstergesi gibi.
 */
export function ScoreBug({
  left,
  right,
  scoreL,
  scoreR,
  youSide,
  flash,
  hitFx = false,
  white,
  band,
  className = "",
}: {
  left: string;
  right: string;
  scoreL: number;
  scoreR: number;
  youSide?: "left" | "right";
  flash?: "left" | "right" | "both";
  hitFx?: boolean;
  white?: { side: "left" | "right"; key: number };
  band?: { label: string; prio?: boolean };
  className?: string;
}) {
  const touch = `${scoreL}-${scoreR}`; // her tuşta değişir → anahtarlı öğeler animasyonu yeniden oynatır
  const hit = (where: "left" | "right") => flash === where || flash === "both";

  const side = (name: string, where: "left" | "right") => {
    const red = where === "left";
    const you = youSide === where;
    return (
      <div className={`min-w-0 border-t-[3px] px-3 pt-2 pb-2.5 ${red ? "border-sig-red" : "border-sig-green text-right"}`}>
        {/* Kendi adın "SEN" yazısı yerine SENİN RENGİNLE (--me) ayırt edilir — klasmanla tutarlı (kullanıcı 11.10). */}
        <div className={`truncate font-display text-[16px] font-bold uppercase leading-tight tracking-wide ${you ? "text-[color:var(--me)]" : ""}`}>
          {name}
        </div>
        <div className={`mt-1.5 flex items-center gap-1.5 ${red ? "" : "justify-end"}`}>
          <span
            key={hit(where) ? `f-${touch}` : "idle"}
            className={`lamp h-2.5 w-2.5 ${red ? "lamp-red" : "lamp-green"} ${
              hit(where) ? (hitFx ? "fx-lamp anim-hit" : "anim-lamp") : ""
            }`}
            aria-hidden="true"
          />
          {white?.side === where && (
            <span
              key={`w-${white.key}`}
              className={`lamp lamp-white fx-lamp anim-hit h-2.5 w-2.5 ${red ? "order-last ml-auto" : "order-first mr-auto"}`}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    );
  };

  // Tuş alan tarafın rakamı sıçrar; "+1" rakamın dış omzundan yükselir (yalnız hitFx).
  const digit = (value: number, where: "left" | "right") => {
    const fx = hitFx && hit(where);
    return (
      <span key={fx ? `d-${where}-${touch}` : `d-${where}`} className={`relative inline-block ${fx ? "anim-score" : ""}`}>
        {value}
        {fx && (
          <span
            className={`fx-plus anim-plus pointer-events-none absolute -top-1 text-[15px] font-bold [text-shadow:0_0_8px_currentColor] ${
              where === "left" ? "right-full mr-0.5 text-sig-red" : "left-full ml-0.5 text-sig-green"
            }`}
            aria-hidden="true"
          >
            +1
          </span>
        )}
      </span>
    );
  };

  return (
    <div
      key={hitFx && flash ? `s-${touch}` : "idle"}
      data-scope="console"
      className={`mesh overflow-hidden rounded-xl ${hitFx && flash ? "anim-shake" : ""} ${className}`}
    >
      {band && (
        <div
          role="status"
          className={`flex items-center justify-center gap-1.5 border-b border-console-line py-1 text-[11px] font-semibold uppercase tracking-wider ${
            band.prio ? "text-prio" : "text-console-steel"
          }`}
        >
          {band.label}
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        {side(left, "left")}
        <div className="relative flex items-center justify-center px-2">
          {/* Ekran "hayalet" rakamları — yalnız skor bandında kullanılır */}
          <span className="num pointer-events-none absolute text-[44px] leading-none opacity-[.08] select-none" aria-hidden="true">
            {"8".repeat(String(scoreL).length)}
            <span className="mx-1">–</span>
            {"8".repeat(String(scoreR).length)}
          </span>
          <span className="num relative text-[44px] leading-none" aria-label={`${scoreL} – ${scoreR}`}>
            {digit(scoreL, "left")}
            <span className="mx-1 text-console-steel">–</span>
            {digit(scoreR, "right")}
          </span>
        </div>
        {side(right, "right")}
      </div>
    </div>
  );
}
