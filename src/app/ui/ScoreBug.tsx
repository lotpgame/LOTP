/**
 * Skor bandı — eskrim cihazı dili (düz bir bant; gerçek bir cihaz markasının görünümü değil).
 * Kural: KIRMIZI = SOL, YEŞİL = SAĞ; renk iyi/kötü demek değildir. "Sen" renkle değil SEN etiketiyle
 * belirtilir. Her zaman koyu (data-scope="console"), kullanıcı teması etkilemez.
 * `flash`: son tuşu alan taraf ("both" = çift tuş) — lambası bir kez yanıp söner (hareketi azalt tercihinde yanıp sönmez).
 * `band`: bant sabitken (sticky) kaybolan periyot bilgisini üstte tutan durum etiketi ("2. Periyot" /
 * altın tuşta `prio` ile --prio altın rengi) — gerçek eskrim cihazlarındaki periyot/öncelik göstergesi gibi.
 */
export function ScoreBug({
  left,
  right,
  scoreL,
  scoreR,
  youSide,
  youLabel,
  flash,
  band,
  className = "",
}: {
  left: string;
  right: string;
  scoreL: number;
  scoreR: number;
  youSide?: "left" | "right";
  youLabel?: string;
  flash?: "left" | "right" | "both";
  band?: { label: string; prio?: boolean };
  className?: string;
}) {
  const side = (name: string, where: "left" | "right") => {
    const red = where === "left";
    return (
      <div className={`min-w-0 border-t-[3px] px-3 pt-2 pb-2.5 ${red ? "border-sig-red" : "border-sig-green text-right"}`}>
        <div className="truncate font-display text-[16px] font-bold uppercase leading-tight tracking-wide">{name}</div>
        <div className={`mt-1.5 flex items-center gap-1.5 ${red ? "" : "justify-end"}`}>
          <span
            key={flash === where || flash === "both" ? `f-${scoreL}-${scoreR}` : "idle"}
            className={`lamp h-2.5 w-2.5 ${red ? "lamp-red" : "lamp-green"} ${flash === where || flash === "both" ? "anim-lamp" : ""}`}
            aria-hidden="true"
          />
          {youSide === where && youLabel && (
            <span className="rounded-[4px] border border-console-line px-1 text-[11px] font-semibold leading-4 tracking-wider">{youLabel}</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div data-scope="console" className={`mesh overflow-hidden rounded-xl ${className}`}>
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
            {scoreL}
            <span className="mx-1 text-console-steel">–</span>
            {scoreR}
          </span>
        </div>
        {side(right, "right")}
      </div>
    </div>
  );
}
